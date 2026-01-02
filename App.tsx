
import React, { useState } from 'react';
import { CalculationState, VarCount, DirectionalInputType, DerivativeResult, PracticeProblem, PracticeState, PracticeFeedback } from './types';
import { calculatePartialDerivative, calculateSecondPartialDerivative, calculateDirectionalDerivative, evaluatePracticeAnswer } from './services/geminiService';

type View = 'START' | 'TOPICS' | 'PARTIAL_FORM' | 'DIRECTIONAL_FORM' | 'RESULT' | 'SOLUTION' | 'PRACTICE_LIST' | 'PRACTICE_DETAIL';

const PRACTICE_PROBLEMS: PracticeProblem[] = [
  {
    id: '1',
    title: 'Basic Partial Differentiation',
    type: 'PARTIAL',
    difficulty: 'Easy',
    question: 'Find the partial derivative f_x for f(x, y) = x^3 y^2 + 5x at the point (1, 2).',
  },
  {
    id: '2',
    title: '3-Variable Rate of Change',
    type: 'PARTIAL',
    difficulty: 'Medium',
    question: 'Find ∂f/∂z for f(x, y, z) = sin(xy) + z^2 e^x at (0, 1, 2).',
  },
  {
    id: '3',
    title: 'Directional Gradient',
    type: 'DIRECTIONAL',
    difficulty: 'Medium',
    question: 'Find the directional derivative of f(x, y) = x^2 - 3xy at P(1, 2) in the direction of v = <3, 4>.',
  },
  {
    id: '4',
    title: 'Level Surface Slope',
    type: 'DIRECTIONAL',
    difficulty: 'Hard',
    question: 'Calculate D_u f for f(x, y, z) = x^2 + y^2 - z^2 at (1, 1, 1) towards the point Q(2, 3, 0).',
  },
];

const App: React.FC = () => {
  const [view, setView] = useState<View>('START');
  
  // Shared Calculation State
  const [state, setState] = useState<CalculationState>({
    loading: false,
    error: null,
    data: null,
    showFullSolution: false,
  });

  // Flow Tracking
  const [lastTopic, setLastTopic] = useState<'PARTIAL' | 'DIRECTIONAL' | null>(null);
  const [isHigherSelectionOpen, setIsHigherSelectionOpen] = useState(false);
  const [higherUseSamePoint, setHigherUseSamePoint] = useState<boolean | null>(null);

  // Practice State
  const [currentProblem, setCurrentProblem] = useState<PracticeProblem | null>(null);
  const [userPracticeAnswer, setUserPracticeAnswer] = useState('');
  const [practiceState, setPracticeState] = useState<PracticeState>({
    loading: false,
    error: null,
    feedback: null,
    showFullSolution: false,
  });

  // Form States - Partial
  const [pVars, setPVars] = useState<VarCount>(2);
  const [pFunc, setPFunc] = useState('');
  const [pPoint, setPPoint] = useState({ x: '', y: '', z: '' });
  const [activeVar, setActiveVar] = useState<'x' | 'y' | 'z'>('x');

  // Form States - Directional
  const [dVars, setDVars] = useState<VarCount>(2);
  const [dFunc, setDFunc] = useState('');
  const [dPoint, setDPoint] = useState({ x: '', y: '', z: '' });
  const [dInputType, setDInputType] = useState<DirectionalInputType>('vector');
  const [dInput, setDInput] = useState({ a: '', b: '', c: '', p2: { x: '', y: '', z: '' } });

  const resetState = () => {
    setState({ loading: false, error: null, data: null, showFullSolution: false });
    setPracticeState({ loading: false, error: null, feedback: null, showFullSolution: false });
    setUserPracticeAnswer('');
    setIsHigherSelectionOpen(false);
    setHigherUseSamePoint(null);
  };

  const handlePartialCalc = async (variable: 'x' | 'y' | 'z') => {
    if (!pFunc) {
      alert("Please enter a function f.");
      return;
    }
    setLastTopic('PARTIAL');
    setActiveVar(variable);
    setView('RESULT');
    setIsHigherSelectionOpen(false);
    setHigherUseSamePoint(null);
    setState(prev => ({ ...prev, loading: true, error: null, data: null }));
    try {
      const result = await calculatePartialDerivative(pFunc, variable, pPoint, pVars);
      setState({ loading: false, error: null, data: result, showFullSolution: false });
    } catch (err) {
      setState({ loading: false, error: 'Failed to process the mathematical expression. Please check your syntax.', data: null, showFullSolution: false });
    }
  };

  const handleHigherCalc = async (secondVariable: 'x' | 'y' | 'z') => {
    setView('RESULT');
    setIsHigherSelectionOpen(false);
    setHigherUseSamePoint(null);
    setState(prev => ({ ...prev, loading: true, error: null, data: null }));
    try {
      const result = await calculateSecondPartialDerivative(pFunc, activeVar, secondVariable, pPoint, pVars);
      setState({ loading: false, error: null, data: result, showFullSolution: false });
    } catch (err) {
      setState({ loading: false, error: 'Failed to calculate higher-order derivative.', data: null, showFullSolution: false });
    }
  };

  const handleDirectionalCalc = async () => {
    if (!dFunc || !dPoint.x || !dPoint.y || (dVars === 3 && !dPoint.z)) {
      alert("Directional derivatives usually require a specific evaluation point.");
      return;
    }
    setLastTopic('DIRECTIONAL');
    setView('RESULT');
    setState(prev => ({ ...prev, loading: true, error: null, data: null }));
    try {
      const result = await calculateDirectionalDerivative(dFunc, dPoint, {
        type: dInputType,
        valA: dInput.a,
        valB: dInput.b,
        valC: dInput.c,
        p2: dInput.p2
      }, dVars);
      setState({ loading: false, error: null, data: result, showFullSolution: false });
    } catch (err) {
      setState({ loading: false, error: 'Calculation failed. Verify your inputs and mathematical notation.', data: null, showFullSolution: false });
    }
  };

  const handleCheckPractice = async () => {
    if (!userPracticeAnswer.trim()) {
      alert("Please enter an answer.");
      return;
    }
    setPracticeState(prev => ({ ...prev, loading: true, error: null, feedback: null }));
    try {
      const fb = await evaluatePracticeAnswer(currentProblem?.question || '', userPracticeAnswer);
      setPracticeState({ loading: false, error: null, feedback: fb, showFullSolution: false });
    } catch (err) {
      setPracticeState({ loading: false, error: 'Error evaluating answer.', feedback: null, showFullSolution: false });
    }
  };

  // Views
  if (view === 'START') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-2xl w-full text-center space-y-10 animate-in fade-in zoom-in duration-700">
          <div className="space-y-4">
            <h1 className="text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Mastering <span className="text-indigo-600 italic">Derivatives</span>
            </h1>
            <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-2xl space-y-8">
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-indigo-500 uppercase tracking-[0.3em]">About this tool</h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                An advanced educational platform for Calculus students. 
                Visualize and solve multivariable derivatives with conceptual clarity 
                and symbolic precision.
              </p>
            </div>
            <button
              onClick={() => setView('TOPICS')}
              className="group relative inline-flex items-center justify-center px-12 py-5 font-bold text-white transition-all duration-200 bg-indigo-600 rounded-2xl focus:outline-none hover:bg-indigo-700 active:scale-95 shadow-xl shadow-indigo-100"
            >
              Start exploring
              <svg className="w-5 h-5 ml-3 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'TOPICS') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-5xl w-full space-y-12 text-center">
          <h2 className="text-3xl font-bold text-slate-800">Select a Module to Explore</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <button 
              onClick={() => { setView('PARTIAL_FORM'); resetState(); }}
              className="group bg-white p-10 rounded-3xl border border-slate-200 shadow-lg hover:border-indigo-500 hover:shadow-2xl transition-all text-center space-y-6"
            >
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <span className="text-2xl font-bold">∂</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Partial Derivatives</h3>
              <p className="text-sm text-slate-500">Calculate rates of change along coordinate axes.</p>
            </button>

            <button 
              onClick={() => { setView('DIRECTIONAL_FORM'); resetState(); }}
              className="group bg-white p-10 rounded-3xl border border-slate-200 shadow-lg hover:border-indigo-500 hover:shadow-2xl transition-all text-center space-y-6"
            >
              <div className="w-16 h-16 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <span className="text-2xl font-bold">∇</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Directional Derivatives</h3>
              <p className="text-sm text-slate-500">Analyze slopes in any arbitrary direction.</p>
            </button>

            <button 
              onClick={() => { setView('PRACTICE_LIST'); resetState(); }}
              className="group bg-white p-10 rounded-3xl border border-slate-200 shadow-lg hover:border-amber-500 hover:shadow-2xl transition-all text-center space-y-6"
            >
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Practice Problems</h3>
              <p className="text-sm text-slate-500">Test your knowledge with guided problems.</p>
            </button>
          </div>
          <button onClick={() => setView('START')} className="text-slate-400 hover:text-slate-600 text-sm font-bold uppercase tracking-widest">Back to Start</button>
        </div>
      </div>
    );
  }

  if (view === 'PRACTICE_LIST') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-4xl w-full space-y-8">
          <header className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-900">Practice Module</h2>
            <p className="text-slate-500 uppercase tracking-widest font-bold text-xs">Choose a challenge to solve</p>
          </header>
          
          <div className="grid gap-4">
            {PRACTICE_PROBLEMS.map((prob) => (
              <button
                key={prob.id}
                onClick={() => { setCurrentProblem(prob); setView('PRACTICE_DETAIL'); resetState(); }}
                className="group bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between hover:border-indigo-400 hover:shadow-xl transition-all"
              >
                <div className="text-left space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-black text-indigo-600 uppercase tracking-tighter">{prob.type}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      prob.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                      prob.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>{prob.difficulty}</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-800">{prob.title}</h4>
                </div>
                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          <div className="text-center pt-8">
             <button onClick={() => setView('TOPICS')} className="text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">Return to Modules</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'PRACTICE_DETAIL' && currentProblem) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="flex items-center justify-between mb-8">
            <button 
              onClick={() => setView('PRACTICE_LIST')}
              className="flex items-center text-slate-400 hover:text-indigo-600 transition-colors text-xs font-bold uppercase tracking-widest"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to List
            </button>
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">Problem Solving Mode</div>
          </header>

          <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-xl space-y-10">
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <h3 className="text-2xl font-black text-slate-900 leading-tight">
                   {currentProblem.title}
                 </h3>
                 <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                      currentProblem.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                      currentProblem.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {currentProblem.difficulty}
                  </span>
               </div>
               <div className="p-8 bg-slate-900 rounded-[2rem] border border-slate-800 math-font text-xl text-white leading-relaxed italic shadow-2xl">
                 <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4 opacity-50 border-b border-indigo-500/30 pb-2">Problem Statement</div>
                 {currentProblem.question}
               </div>
            </div>

            {!practiceState.feedback ? (
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Your Answer</label>
                    <input 
                      type="text" 
                      value={userPracticeAnswer}
                      onChange={(e) => setUserPracticeAnswer(e.target.value)}
                      placeholder="e.g. 15, or ∂f/∂x = 3x^2"
                      className="w-full px-6 py-5 bg-white border-2 border-slate-100 rounded-2xl text-lg math-font focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    />
                 </div>
                 <button
                   onClick={handleCheckPractice}
                   disabled={practiceState.loading}
                   className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                 >
                   {practiceState.loading ? 'Evaluating...' : 'Check Answer'}
                 </button>
              </div>
            ) : (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`p-8 rounded-3xl border-2 flex items-center space-x-6 ${
                  practiceState.feedback.isCorrect ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                    practiceState.feedback.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {practiceState.feedback.isCorrect ? (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    ) : (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-black uppercase tracking-tight mb-1">{practiceState.feedback.isCorrect ? 'Correct Answer!' : 'Not Quite Right'}</h4>
                    <p className="font-medium opacity-80">{practiceState.feedback.feedback}</p>
                  </div>
                </div>

                {!practiceState.showFullSolution ? (
                  <div className="flex flex-col space-y-6">
                    <button
                      onClick={() => setPracticeState(prev => ({ ...prev, showFullSolution: true }))}
                      className="w-full py-6 px-10 bg-white text-indigo-600 rounded-3xl font-black border-4 border-indigo-50 hover:bg-indigo-50 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-slate-100"
                    >
                      <span>Explanation?</span>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                    <button 
                      onClick={resetState}
                      className="text-slate-400 hover:text-indigo-600 text-[11px] font-bold uppercase tracking-[0.3em] pt-4 transition-colors"
                    >
                      Try Solving Again
                    </button>
                  </div>
                ) : (
                  <div className="space-y-12 animate-in slide-in-from-top-6 duration-400">
                     <div className="bg-slate-900 p-10 md:p-12 rounded-[3rem] text-slate-100 shadow-2xl overflow-x-auto border-4 border-slate-800">
                        <div className="flex items-center justify-between mb-12 border-b border-slate-800 pb-6">
                          <h4 className="text-[11px] font-bold uppercase tracking-[0.4em] text-indigo-400">Step-by-Step Symbolic Solution</h4>
                          <span className="px-3 py-1 bg-slate-800 rounded-full text-[9px] font-bold text-slate-500 tracking-widest uppercase">Verified Accuracy</span>
                        </div>
                        <div className="math-font text-xl md:text-2xl whitespace-pre-wrap leading-[3.5rem] text-slate-200">
                          {practiceState.feedback.fullSolution}
                        </div>
                     </div>

                     <div className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.4em] text-indigo-200 mb-10 flex items-center">
                          <svg className="w-6 h-6 mr-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                          </svg>
                          Key Points to Remember
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-8">
                          {practiceState.feedback.keyPoints.map((kp, i) => (
                            <div key={i} className="bg-white/10 p-6 rounded-2xl border border-white/10 flex items-start space-x-5 transition-transform hover:scale-105">
                              <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-inner">
                                {i+1}
                              </span>
                              <p className="text-sm font-semibold leading-relaxed opacity-95">
                                {kp}
                              </p>
                            </div>
                          ))}
                        </div>
                     </div>
                     <div className="pt-8 text-center">
                        <button 
                          onClick={() => setView('PRACTICE_LIST')} 
                          className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-slate-800 active:scale-95 transition-all"
                        >
                          Finish Problem
                        </button>
                     </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'PARTIAL_FORM') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-2xl w-full bg-white rounded-3xl p-10 shadow-2xl space-y-8 border border-slate-100">
          <header className="text-center space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Partial Derivatives</h2>
            <p className="text-sm text-slate-500 uppercase tracking-widest font-bold">Input Parameters</p>
          </header>

          <div className="space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setPVars(2)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${pVars === 2 ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>2 Variables</button>
              <button onClick={() => setPVars(3)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${pVars === 3 ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>3 Variables</button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Function f({pVars === 2 ? 'x, y' : 'x, y, z'})</label>
              <input 
                type="text" value={pFunc} onChange={e => setPFunc(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl math-font focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. x^2 * y"
              />
            </div>

            <div className={`grid ${pVars === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-4`}>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">x value (Optional)</label>
                <input value={pPoint.x} onChange={e => setPPoint({...pPoint, x: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Leave empty for symbolic" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">y value (Optional)</label>
                <input value={pPoint.y} onChange={e => setPPoint({...pPoint, y: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Leave empty for symbolic" />
              </div>
              {pVars === 3 && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">z value (Optional)</label>
                  <input value={pPoint.z} onChange={e => setPPoint({...pPoint, z: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Leave empty for symbolic" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
              <button onClick={() => handlePartialCalc('x')} className="bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg">∂f/∂x</button>
              <button onClick={() => handlePartialCalc('y')} className="bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg">∂f/∂y</button>
              {pVars === 3 && <button onClick={() => handlePartialCalc('z')} className="bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg col-span-2 lg:col-span-1">∂f/∂z</button>}
            </div>
          </div>
          <button onClick={() => setView('TOPICS')} className="w-full text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em] pt-4">Cancel & Return</button>
        </div>
      </div>
    );
  }

  if (view === 'DIRECTIONAL_FORM') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-2xl w-full bg-white rounded-3xl p-10 shadow-2xl space-y-8 border border-slate-100">
          <header className="text-center space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Directional Derivatives</h2>
            <p className="text-sm text-slate-500 uppercase tracking-widest font-bold">Input Parameters</p>
          </header>

          <div className="space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setDVars(2)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${dVars === 2 ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>2 Variables</button>
              <button onClick={() => setDVars(3)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${dVars === 3 ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>3 Variables</button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Function f</label>
              <input 
                type="text" value={dFunc} onChange={e => setDFunc(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl math-font focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. x^2 + y^2"
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <button onClick={() => setDInputType('vector')} className={`py-2 px-3 rounded-lg text-[10px] font-bold border-2 transition-all ${dInputType === 'vector' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-slate-100 text-slate-500'}`}>VECTOR</button>
              {dVars === 2 && <button onClick={() => setDInputType('theta')} className={`py-2 px-3 rounded-lg text-[10px] font-bold border-2 transition-all ${dInputType === 'theta' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-slate-100 text-slate-500'}`}>ANGLE</button>}
              <button onClick={() => setDInputType('points')} className={`py-2 px-3 rounded-lg text-[10px] font-bold border-2 transition-all ${dInputType === 'points' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-slate-100 text-slate-500'}`}>TWO POINTS</button>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">At Point P</label>
                  <div className="grid grid-cols-3 gap-3">
                    <input placeholder="x value" value={dPoint.x} onChange={e => setDPoint({...dPoint, x: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-200 bg-white" />
                    <input placeholder="y value" value={dPoint.y} onChange={e => setDPoint({...dPoint, y: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-200 bg-white" />
                    {dVars === 3 && <input placeholder="z value" value={dPoint.z} onChange={e => setDPoint({...dPoint, z: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-200 bg-white" />}
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    {dInputType === 'vector' ? 'Direction Vector v' : dInputType === 'theta' ? 'Direction Angle θ' : 'To Point Q'}
                  </label>
                  {dInputType === 'vector' && (
                    <div className="grid grid-cols-3 gap-3">
                      <input placeholder="v₁" value={dInput.a} onChange={e => setDInput({...dInput, a: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-200 bg-white" />
                      <input placeholder="v₂" value={dInput.b} onChange={e => setDInput({...dInput, b: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-200 bg-white" />
                      {dVars === 3 && <input placeholder="v₃" value={dInput.c} onChange={e => setDInput({...dInput, c: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-200 bg-white" />}
                    </div>
                  )}
                  {dInputType === 'theta' && (
                    <input placeholder="Angle in Radians" value={dInput.a} onChange={e => setDInput({...dInput, a: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white" />
                  )}
                  {dInputType === 'points' && (
                    <div className="grid grid-cols-3 gap-3">
                      <input placeholder="qₓ value" value={dInput.a} onChange={e => setDInput({...dInput, a: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-200 bg-white" />
                      <input placeholder="qᵧ value" value={dInput.b} onChange={e => setDInput({...dInput, b: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-200 bg-white" />
                      {dVars === 3 && <input placeholder="q_z value" value={dInput.c} onChange={e => setDInput({...dInput, c: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-200 bg-white" />}
                    </div>
                  )}
               </div>
            </div>

            <button
              onClick={handleDirectionalCalc}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xl"
            >
              Calculate Directional Derivative
            </button>
          </div>
          <button onClick={() => setView('TOPICS')} className="w-full text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em] pt-4">Cancel & Return</button>
        </div>
      </div>
    );
  }

  if (view === 'RESULT') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-2xl w-full bg-white rounded-3xl p-12 shadow-2xl border border-slate-100 text-center space-y-10">
          {state.loading ? (
            <div className="space-y-6 py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
              <div className="space-y-2">
                <p className="text-xl font-bold text-slate-800 animate-pulse">Analyzing Surface...</p>
                <p className="text-sm text-slate-400 uppercase tracking-widest font-bold">Computing exact symbolic result</p>
              </div>
            </div>
          ) : state.error ? (
            <div className="space-y-6 py-12">
               <div className="text-red-500 bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
               </div>
               <p className="text-slate-700 font-bold">{state.error}</p>
               <button onClick={() => setView('TOPICS')} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold">Return to Topics</button>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Final Mathematical Result</h3>
                <div className="w-12 h-0.5 bg-indigo-200 mx-auto rounded-full"></div>
              </div>

              <div className="bg-indigo-600 p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100 transform hover:scale-105 transition-transform duration-300">
                <div className="math-font text-4xl font-black text-white leading-relaxed">
                  {state.data?.result}
                </div>
              </div>

              <div className="pt-10 flex flex-col items-center space-y-4">
                <button
                  onClick={() => setView('SOLUTION')}
                  className="w-full max-w-sm py-5 px-10 bg-white text-indigo-600 rounded-2xl font-black border-4 border-indigo-50 hover:bg-indigo-50 transition-all flex items-center justify-center space-x-3 shadow-xl"
                >
                  <span>Explanation?</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>

                {lastTopic === 'PARTIAL' && !isHigherSelectionOpen && (
                  <button
                    onClick={() => setIsHigherSelectionOpen(true)}
                    className="w-full max-w-sm py-4 px-10 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center space-x-2"
                  >
                    <span>Calculate Higher Derivative?</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </button>
                )}

                {isHigherSelectionOpen && (
                  <div className="w-full max-w-md p-6 bg-slate-100 rounded-3xl space-y-6 animate-in fade-in slide-in-from-top-4 border border-slate-200">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left px-2">1. Evaluation Point Selection</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setHigherUseSamePoint(true)}
                          className={`py-3 rounded-xl font-bold text-xs transition-all border-2 ${higherUseSamePoint === true ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-500'}`}
                        >
                          Same Point
                        </button>
                        <button 
                          onClick={() => setHigherUseSamePoint(false)}
                          className={`py-3 rounded-xl font-bold text-xs transition-all border-2 ${higherUseSamePoint === false ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-500'}`}
                        >
                          Change Point
                        </button>
                      </div>

                      {higherUseSamePoint === false && (
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">New Coordinates (Leave empty for symbolic)</h5>
                          <div className={`grid ${pVars === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
                            <input placeholder="x val" value={pPoint.x} onChange={e => setPPoint({...pPoint, x: e.target.value})} className="px-3 py-2 border rounded-lg text-sm bg-slate-50" />
                            <input placeholder="y val" value={pPoint.y} onChange={e => setPPoint({...pPoint, y: e.target.value})} className="px-3 py-2 border rounded-lg text-sm bg-slate-50" />
                            {pVars === 3 && <input placeholder="z val" value={pPoint.z} onChange={e => setPPoint({...pPoint, z: e.target.value})} className="px-3 py-2 border rounded-lg text-sm bg-slate-50" />}
                          </div>
                        </div>
                      )}
                    </div>

                    {higherUseSamePoint !== null && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left px-2">2. Differentiate again wrt:</h4>
                        <div className="flex space-x-2">
                          <button onClick={() => handleHigherCalc('x')} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition-all">x</button>
                          <button onClick={() => handleHigherCalc('y')} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition-all">y</button>
                          {pVars === 3 && <button onClick={() => handleHigherCalc('z')} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition-all">z</button>}
                        </div>
                      </div>
                    )}
                    
                    <button onClick={() => setIsHigherSelectionOpen(false)} className="w-full text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest pt-2 transition-colors">Cancel</button>
                  </div>
                )}

                <button 
                  onClick={() => setView('TOPICS')} 
                  className="text-slate-400 hover:text-indigo-500 text-[10px] font-bold uppercase tracking-widest pt-4"
                >
                  Start New Calculation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'SOLUTION') {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-6 font-sans">
        <div className="max-w-4xl mx-auto space-y-12">
          <header className="flex items-center justify-between">
            <button 
              onClick={() => setView('RESULT')}
              className="flex items-center text-slate-400 hover:text-indigo-600 transition-colors text-xs font-bold uppercase tracking-widest"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Result
            </button>
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">Comprehensive derivation</div>
          </header>

          <div className="space-y-8">
            {/* Conceptual Section */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Mathematical Interpretation</h3>
              <p className="text-slate-700 leading-relaxed text-lg">
                {state.data?.explanation}
              </p>
            </div>

            {/* Step by Step */}
            <div className="bg-slate-900 p-10 md:p-12 rounded-[2.5rem] text-slate-50 shadow-2xl overflow-x-auto border border-slate-800">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-10 border-b border-slate-800 pb-4">Full Step-by-Step Symbolic Solution</h4>
              <div className="math-font text-lg md:text-xl whitespace-pre-wrap leading-[3rem] text-slate-200">
                {state.data?.fullSolution}
              </div>
            </div>

            {/* Key Points */}
            <div className="bg-indigo-600 p-10 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-8 flex items-center">
                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
                Crucial Concepts to Remember
              </h4>
              <div className="grid sm:grid-cols-2 gap-6">
                {state.data?.keyPoints.map((point, idx) => (
                  <div key={idx} className="bg-indigo-500/30 p-6 rounded-2xl border border-white/10 flex items-start space-x-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-black">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-medium leading-relaxed opacity-95">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-12 text-center">
            <button 
              onClick={() => setView('TOPICS')}
              className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95"
            >
              Start New Exploration
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default App;
