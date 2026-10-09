(()=>{'use strict';
  /**
   * LOLA cognitive core — faithful JavaScript port of the deterministic
   * modules from the LOLA runtime (lola's main, #42-#48 thread).
   *
   * Ported 1:1 (same tokenisation, same thresholds, same tie-break order):
   *   - lola_answer_planner   -> planAnswer      (question type + answer sections)
   *   - lola_fast_triage      -> fastTriage      (ANSWER / INSPECT / MAP)
   *   - lola_evidence_bus     -> EvidenceBus     (findings, evidence wins, not agent count)
   *   - lola_presentation     -> confidenceFromEvidence (+ the two hard rules)
   *   - lola_observe          -> recordObservation (TEST->OBSERVE->signed delta)
   *   - lola_cognitive_budget -> CognitiveBudget + stopCondition (fixed check order)
   *   - lola_runtime_loop     -> runCognitive (ANSWER / INSPECT / MAP + research gate)
   *
   * Zero LLM, zero network in this module: it decides WHAT, in what ORDER, and
   * how confident the answer is. The caller supplies the sources (offline text
   * and, optionally, a fetched online answer) — the HYBRID router. Novelty
   * before external: external evidence is quarantined unless a frozen internal
   * hypothesis exists (the research gate). Confidence is an evidence-state
   * string (SUPPORTED / PARTIALLY_SUPPORTED / CONTRADICTED / UNVERIFIED), never
   * a fabricated percentage.
   */

  // ---------- tokens (identical to lola's _tokens) ----------
  function tokens(value){
    return new Set(String(value||'').toLowerCase().split(/[^a-z0-9]+/).filter(t=>t.length>2));
  }

  // ---------- answer planner (lola_answer_planner.py) ----------
  const TROUBLESHOOTING_KW=new Set(['why','error','fail','failed','failure','freeze','frozen','crash','crashes','bug','broken','hang','hung','not','working','issue','problem','cause','causes']);
  const RESEARCH_KW=new Set(['research','study','survey','compare','compared','evaluate','analyze','analyse','investigate','evidence','which','best','options']);
  const IMPLEMENTATION_KW=new Set(['implement','build','create','add','change','modify','write','develop','make','deploy','integrate','refactor']);
  const PRIORITY=['TROUBLESHOOTING','RESEARCH','IMPLEMENTATION'];
  const TEMPLATES={
    TROUBLESHOOTING:['Finding','Evidence','Root cause','Fix','Verification','Unknowns'],
    RESEARCH:['Question','Known evidence','Competing explanations','Findings','Limitations','Conclusion'],
    IMPLEMENTATION:['Target','Change','Dependencies','Implementation','Tests','Regression','Result'],
    GENERIC:['Summary','Evidence','Reasoning','Result','Unknowns']
  };
  const KEYWORDS={TROUBLESHOOTING:TROUBLESHOOTING_KW,RESEARCH:RESEARCH_KW,IMPLEMENTATION:IMPLEMENTATION_KW};
  function planAnswer(question){
    const q=tokens(question);
    const scores={};
    for(const t of PRIORITY){
      let n=0; for(const k of KEYWORDS[t]) if(q.has(k)) n++;
      scores[t]=n;
    }
    const best=Math.max(...PRIORITY.map(t=>scores[t]));
    if(best===0)return{question_type:'GENERIC',reason:[],sections:TEMPLATES.GENERIC.slice()};
    const winners=PRIORITY.filter(t=>scores[t]===best);
    const chosen=winners[0]; // fixed priority wins ties: first in PRIORITY
    const hit=[]; for(const k of KEYWORDS[chosen]) if(q.has(k)) hit.push(k);
    hit.sort();
    return{question_type:chosen,reason:hit,sections:TEMPLATES[chosen].slice()};
  }
  function plannedSections(questions){return questions.map(q=>planAnswer(q).sections)}

  // ---------- fast triage (lola_fast_triage.py) ----------
  const INSPECT_KEYWORDS=['file','log','diff','test','build','status','dependency','schema','compile','version','size','count'];
  function verifiedMatch(question,verifiedState){
    const q=tokens(question);
    let bestKey='',bestHits=1;
    for(const key of Object.keys(verifiedState||{})){
      const k=tokens(key);
      let hits=0; for(const t of q) if(k.has(t)) hits++;
      if(hits>=2&&hits>bestHits){bestHits=hits;bestKey=key;}
    }
    return bestKey;
  }
  function fastTriage(question,opts={}){
    const vs=opts.verifiedState||{};
    const key=verifiedMatch(question,vs);
    if(key)return{route:'ANSWER',why:'answered from verified state: '+key,external_justified:false,match:key};
    const q=tokens(question);
    const hit=INSPECT_KEYWORDS.find(kw=>q.has(kw))||'';
    if(hit)return{route:'INSPECT',why:'deterministic inspection closes the gap: '+hit,external_justified:false,match:hit};
    return{route:'MAP',why:'complexity/uncertainty map required',external_justified:false,match:''};
  }

  // ---------- evidence bus (lola_evidence_bus.py) ----------
  function makeEvidenceBus(){
    const findings=[]; const evidence=new Set();
    return{
      findings,
      registerEvidence(...ids){for(const id of ids)evidence.add(id);},
      evidenceIds(){return[...evidence].sort();},
      submit(f){
        const unknown=f.evidence_ids.filter(e=>!evidence.has(e));
        if(unknown.length)throw new Error('unknown evidence ids: '+unknown.join(', '));
        const uc=(f.contradictions||[]).filter(e=>!evidence.has(e));
        if(uc.length)throw new Error('unknown contradiction evidence ids: '+uc.join(', '));
        findings.push(f);
      },
      forClaim(claim){return findings.filter(f=>f.finding===claim);},
      supports(claim){const s=new Set();for(const f of this.forClaim(claim))for(const e of f.evidence_ids)s.add(e);return s;},
      contradicts(claim){const s=new Set();for(const f of this.forClaim(claim))for(const e of (f.contradictions||[]))s.add(e);return s;},
      discriminatingEvidence(a,b){
        const sa=this.supports(a),sb=this.supports(b);
        if(!sa.size||!sb.size)return[];
        const out=new Set();
        for(const e of sa) if(!sb.has(e)) out.add(e);
        for(const e of sb) if(!sa.has(e)) out.add(e);
        return[...out].sort();
      },
      verdict(a,b){
        const disc=this.discriminatingEvidence(a,b);
        if(!disc.length)return{winner:null,discriminating:false,note:'evidence does not discriminate; claims stand unverified — no winner by agent count'};
        const ca=this.contradicts(a),cb=this.contradicts(b);
        if(ca.size&&cb.size)return{winner:null,discriminating:true,note:'both claims contradicted; keep both open'};
        if(ca.size)return{winner:b,discriminating:true,note:a+' contradicted by '+[...ca].sort().join(', ')};
        if(cb.size)return{winner:a,discriminating:true,note:b+' contradicted by '+[...cb].sort().join(', ')};
        return{winner:null,discriminating:true,note:'discriminating evidence exists but contradicts neither claim decisively; keep both open'};
      }
    };
  }
  function claimStates(bus,claims){
    return claims.map(c=>{
      const f=bus.forClaim(c);
      const supported=f.length&&f.every(x=>(x.evidence_ids||[]).length);
      const contradicted=f.some(x=>(x.contradictions||[]).length);
      const state=contradicted?'CONTRADICTED':(supported?'SUPPORTED':'UNVERIFIED');
      const ids=new Set(); for(const x of f) for(const e of (x.evidence_ids||[])) ids.add(e);
      return{id:c,state,evidence_ids:[...ids].sort()};
    });
  }

  // ---------- presentation / confidence (lola_presentation.py) ----------
  const STYLES=['AUTO','COMPACT','BEGINNER','TECHNICAL','ENGINEER','MANAGER','RESEARCH','AUDIT','TUTORIAL','TABLE','DIAGRAM'];
  function applyStyle(answer,style){
    if(!STYLES.includes(style))throw new Error('unknown style: '+style);
    const sections=answer.sections.slice();
    if(style==='COMPACT'){
      const out=[];
      for(const s of sections){
        if(!s.required)continue;
        let text=s.text;
        if(text.length>160)text=text.slice(0,157)+' [...]';
        out.push({title:s.title,text,required:true});
      }
      return{sections:out,lead:''};
    }
    if(style==='BEGINNER'){
      const firstReq=sections.find(s=>s.required);
      let lead='';
      if(firstReq){
        const sentence=String(firstReq.text||'').trim().split('. ')[0];
        lead='In short: '+sentence;
      }
      return{sections,lead};
    }
    return{sections,lead:answer.lead}; // identity transform (v1)
  }
  function confidenceFromEvidence(claims){
    const states=(claims||[]).map(c=>String(c.state||'UNVERIFIED').toUpperCase());
    if(!claims||!claims.length)return{confidence:'UNVERIFIED',evidence_ids:[],provenance:[]};
    let conf;
    if(states.includes('CONTRADICTED'))conf='CONTRADICTED';
    else if(claims.every(c=>(c.evidence_ids||[]).length))conf='SUPPORTED';
    else if(claims.some(c=>(c.evidence_ids||[]).length))conf='PARTIALLY_SUPPORTED';
    else conf='UNVERIFIED';
    const ids=new Set(); for(const c of claims) for(const e of (c.evidence_ids||[])) ids.add(String(e));
    return{
      confidence:conf,
      evidence_ids:[...ids].sort(),
      provenance:claims.map(c=>({claim:c.id,state:String(c.state||'UNVERIFIED').toUpperCase(),evidence_ids:(c.evidence_ids||[]).map(String).sort()}))
    };
  }

  // ---------- observe (lola_observe.py) ----------
  function computePredictionError(expected,observed){return observed-expected;}
  function recordObservation(id,{expected,observed,source='',tolerance=1.0}={}){
    const err=computePredictionError(expected,observed);
    return{observation_id:id,expected,observed,prediction_error:err,source,needs_recheck:Math.abs(err)>tolerance};
  }

  // ---------- cognitive budget + stop conditions (lola_cognitive_budget.py) ----------
  const AXES=['depth','agents','tokens','tool_calls','research','external_access','latency_ms'];
  const INFO_GAIN_FLOOR=0.1;
  function makeCognitiveBudget(){
    const limits={depth:4,agents:8,tokens:20000,tool_calls:50,research:4,external_access:2,latency_ms:300000};
    const used={};
    for(const a of AXES)used[a]=0;
    return{
      limits,used,
      consume(axis,amount=1){if(!(axis in used))throw new Error('no such budget axis: '+axis);used[axis]+=amount;},
      exhausted(axis){if(!(axis in used))throw new Error('no such budget axis: '+axis);return used[axis]>=limits[axis];},
      anyExhausted(){return AXES.some(a=>this.exhausted(a));}
    };
  }
  const STOP_ANSWERED='ANSWERED_WITH_EVIDENCE';
  const STOP_NO_DECISION_CHANGE='UNCERTAINTY_CHANGES_NOTHING';
  const STOP_LOW_GAIN='LOW_INFORMATION_GAIN';
  const STOP_BUDGET='BUDGET_REACHED';
  const STOP_NO_EVIDENCE='EVIDENCE_UNAVAILABLE';
  const STOP_HUMAN='HUMAN_DECISION_REQUIRED';
  function stopCondition(state){
    if(state.answered)return STOP_ANSWERED;
    if(!state.uncertainty_changes_decision)return STOP_NO_DECISION_CHANGE;
    if(Number(state.info_gain==null?1.0:state.info_gain)<INFO_GAIN_FLOOR)return STOP_LOW_GAIN;
    if(state.budget&&state.budget.anyExhausted())return STOP_BUDGET;
    if(!state.evidence_available)return STOP_NO_EVIDENCE;
    if(state.human_required)return STOP_HUMAN;
    return null;
  }

  // ---------- learning governor (lola_runtime_loop.learning_governor) ----------
  function learningGovernor(report){
    if(report.quarantined||report.confidence==='CONTRADICTED')return'REJECT';
    if(report.stopped_by===STOP_ANSWERED&&!report.violations.length&&report.transfer_passed&&report.regression_passed)return'PROMOTE';
    return'RETAIN';
  }

  // ---------- hybrid runtime loop (lola_runtime_loop.run_loop, app-shaped) ----------
  /**
   * params:
   *   question         the user's question
   *   offlineAnswer    {matches:[...sentences], confident:bool} from the local extractive engine
   *   onlineAnswer     optional {text:string} fetched from the configured endpoint (EXTERNAL)
   *   verifiedState    optional {key: value} learned/verified facts (offline knowledge base)
   *   inspectable      optional [ids] locally inspectable items (files, document structure)
   *   frozenHypothesis optional {frozen_before_external:bool} internal reasoning done before external
   *   onFetchExternal  optional async (question, context) => text  (the online call; injectable for tests)
   *   budget           optional CognitiveBudget
   *   prediction/observed optional numbers for the OBSERVE stage
   * Returns a LoopReport-shaped object plus `matches` and `source` for the UI.
   */
  async function runCognitive(params){
    const {question,offlineAnswer,verifiedState={},inspectable=[],frozenHypothesis=null,
           onFetchExternal,budget,onlineAnswer,prediction,observed}=params;
    const b=budget||makeCognitiveBudget();
    const trace=[]; const violations=[];
    const step=(name,status='done')=>trace.push({step:status==='done'?name:name,status});

    let predErr=null,needsRecheck=false;
    if(prediction!=null&&observed!=null){
      const o=recordObservation('obs-1',{expected:prediction,observed});
      predErr=o.prediction_error; needsRecheck=o.needs_recheck;
    }

    step('Intake');
    const plan=planAnswer(question);
    const triage=fastTriage(question,{verifiedState,inspectable});
    step('Triage: '+triage.route);

    if(triage.route==='ANSWER'){
      step('Local knowledge checked');
      if(predErr!=null)step('Observe (delta '+predErr+')');
      step('Synthesize');
      step('Answer ('+plan.question_type+')');
      return{
        question,route:'ANSWER',stopped_by:STOP_ANSWERED,
        evidence_ids:['verified:'+triage.match],confidence:'SUPPORTED',
        agents_used:0,external_sources_used:0,quarantined:false,
        violations:[],trace,answer_type:plan.question_type,planned_sections:plan.sections,
        prediction_error:predErr,needs_recheck:needsRecheck,
        matches:[verifiedState[triage.match]||''],
        source:'verified',
        plan,triage
      };
    }

    step('Self-inventory');
    step('GAP: '+(inspectable.length?'local documents':'none'));
    if(inspectable.length||offlineAnswer)step('Internal reasoning');

    // research gate: external is justified only after internal reasoning (novelty before external)
    let externalText=onlineAnswer&&String(onlineAnswer.text||'').trim();
    let quarantined=false;
    if(!externalText&&typeof onFetchExternal==='function'){
      b.consume('external_access');
      const context=(offlineAnswer&&offlineAnswer.matches||[]).join(' ').slice(0,1200);
      try{externalText=String(await onFetchExternal(question,context)||'').trim();}catch{externalText='';}
    }
    let externalUsed=0;
    if(externalText){
      externalUsed=1;
      if(!(frozenHypothesis&&frozenHypothesis.frozen_before_external)){
        quarantined=true;
        violations.push('NOVELTY_BEFORE_EXTERNAL');
        step('External gate: QUARANTINE');
      }else{
        step('External gate: justified');
      }
    }

    // evidence: offline extractive hits + (possibly quarantined) external answer
    const bus=makeEvidenceBus();
    const offlineMatches=(offlineAnswer&&offlineAnswer.matches)||[];
    const offlineIds=offlineMatches.map((_,i)=>'doc:s'+i);
    if(offlineIds.length)bus.registerEvidence(...offlineIds);
    if(externalText){
      bus.registerEvidence('external:0');
      const finding={agent:'external',finding:'GAP_RESOLVED',evidence_ids:quarantined?[]:['external:0'],
                     unknowns:[],contradictions:quarantined?['external:0']:[],next_gap:quarantined?'quarantined':''};
      bus.submit(finding);
    }
    if(offlineMatches.length){
      bus.submit({agent:'offline',finding:'GAP_RESOLVED',evidence_ids:offlineIds,unknowns:[],contradictions:[],next_gap:''});
    }
    const claims=claimStates(bus,['GAP_RESOLVED']);
    const conf=confidenceFromEvidence(claims).confidence;
    const ev=bus.evidenceIds();
    if(predErr!=null)step('Observe (delta '+predErr+')');
    step('Verify');
    step('Synthesize');
    step('Answer ('+plan.question_type+')');

    const answered=ev.length>0&&conf==='SUPPORTED';
    const stopped=stopCondition({
      answered,
      uncertainty_changes_decision:true,
      info_gain:answered?1.0:(ev.length?0.5:0.0),
      budget:b,
      evidence_available:ev.length>0,
      human_required:false
    })||STOP_ANSWERED;

    // final match list: offline matches + quarantined-external flag + online text (when not quarantined)
    const matches=offlineMatches.slice();
    if(externalText&&!quarantined)matches.push(externalText);
    const source=matches.length?(externalText&&!quarantined?'hybrid':'offline'):(externalText?'external-quarantined':'none');

    return{
      question,route:triage.route,stopped_by:stopped,
      evidence_ids:ev,confidence:conf,
      agents_used:0,external_sources_used:externalUsed,quarantined,
      violations:violations.slice(),trace:trace.slice(),
      answer_type:plan.question_type,planned_sections:plan.sections,
      prediction_error:predErr,needs_recheck:needsRecheck,
      transfer_passed:false,regression_passed:false,
      matches,source,
      plan,triage
    };
  }

  globalThis.MSALolaCognitive={
    tokens,planAnswer,plannedSections,
    TEMPLATES,PRIORITY,INSPECT_KEYWORDS,
    fastTriage,verifiedMatch,
    makeEvidenceBus,claimStates,
    applyStyle,confidenceFromEvidence,STYLES,
    recordObservation,computePredictionError,
    makeCognitiveBudget,stopCondition,AXES,
    learningGovernor,runCognitive,
    STOP_ANSWERED,STOP_NO_DECISION_CHANGE,STOP_LOW_GAIN,STOP_BUDGET,STOP_NO_EVIDENCE,STOP_HUMAN,
    // provenance: which lola module each function mirrors (for audit)
    _PROVENANCE:{
      planAnswer:'lola_answer_planner.plan_answer',
      fastTriage:'lola_fast_triage.fast_triage',
      makeEvidenceBus:'lola_evidence_bus.EvidenceBus',
      confidenceFromEvidence:'lola_presentation.confidence_from_evidence',
      applyStyle:'lola_presentation.apply_style',
      recordObservation:'lola_observe.record_observation',
      makeCognitiveBudget:'lola_cognitive_budget.CognitiveBudget',
      stopCondition:'lola_cognitive_budget.stop_condition',
      learningGovernor:'lola_runtime_loop.learning_governor',
      runCognitive:'lola_runtime_loop.run_loop (hybrid app shaping)'
    }
  };
})();
