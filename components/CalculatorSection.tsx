
import React from 'react';
import { CalculationState } from '../types';

interface CalculatorSectionProps {
  title: string;
  theory: string;
  children: React.ReactNode;
  state: CalculationState;
  onShowSolution: () => void;
}

export const CalculatorSection: React.FC<CalculatorSectionProps> = ({
  title,
  theory,
  children,
  state,
  onShowSolution,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-12 transition-all hover:shadow-md">
      {/* Theory Header */}
      <div className="p-6 md:p-8 border-b border-slate-100 bg-indigo-50/20">
        <h2 className="text-2xl font-bold text-slate-800 mb-3">{title}</h2>
        <div className="flex items-start space-x-3 text-slate-600">
          <div className="mt-1 bg-indigo-100 p-1 rounded-md">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm leading-relaxed">{theory}</p>
        </div>
      </div>
      
      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Input Side */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parameters</h3>
            {children}
          </div>

          {/* Result Side */}
          <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 min-h-[400px] flex flex-col">
            {state.loading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                <p className="text-slate-500 font-medium animate-pulse text-center">Processing...</p>
              </div>
            ) : state.error ? (
              <div className="flex-1 flex flex-col items-center justify-center text-red-500 p-4 text-center">
                <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-semibold">{state.error}</p>
              </div>
            ) : state.data ? (
              <div className="flex-1 space-y-6 animate-in fade-in duration-500">
                <div>
                  <h3 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-3">Interpretation</h3>
                  <div className="text-slate-700 text-sm leading-relaxed bg-white p-4 rounded-xl border border-indigo-50 shadow-sm">
                    {state.data.explanation}
                  </div>
                </div>

                <div className="bg-indigo-600 p-6 rounded-2xl shadow-indigo-100 shadow-xl">
                  <h3 className="text-[10px] font-bold text-indigo-200 uppercase mb-2">Calculated Result</h3>
                  <div className="math-font text-2xl font-bold text-white">
                    {state.data.result}
                  </div>
                </div>

                {!state.showFullSolution ? (
                  <button
                    onClick={onShowSolution}
                    className="w-full py-4 px-4 bg-white text-indigo-600 rounded-xl font-bold border-2 border-indigo-50 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Explanation?</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="p-6 bg-slate-900 rounded-2xl text-slate-50 shadow-2xl overflow-x-auto">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-6 border-b border-slate-800 pb-2">Full Step-by-Step Solution</h4>
                      <div className="math-font text-sm whitespace-pre-wrap leading-loose">
                        {state.data.fullSolution}
                      </div>
                    </div>

                    <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-4 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                        Key Points to Remember
                      </h4>
                      <ul className="space-y-3">
                        {state.data.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start space-x-3 text-sm text-slate-700">
                            <span className="flex-shrink-0 w-5 h-5 bg-indigo-200 text-indigo-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <p className="text-sm font-medium">Results will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
