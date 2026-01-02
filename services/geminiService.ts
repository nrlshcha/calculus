
import { GoogleGenAI, Type } from "@google/genai";
import { DerivativeResult, VarCount, DirectionalInputType, PracticeFeedback } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    result: {
      type: Type.STRING,
      description: "The final numerical or symbolic answer using clear mathematical notation (e.g., f_xx = ..., ∂²f/∂x² = ...).",
    },
    explanation: {
      type: Type.STRING,
      description: "A high-level conceptual interpretation of what this specific result means physically or geometrically.",
    },
    fullSolution: {
      type: Type.STRING,
      description: "A rigorous step-by-step symbolic derivation. Use multiple newlines between steps for extreme vertical spacing. Ensure all variables are shown clearly.",
    },
    keyPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of the 3-4 most important mathematical rules or conceptual 'takeaways' used in this calculation.",
    },
  },
  required: ["result", "explanation", "fullSolution", "keyPoints"],
};

const feedbackSchema = {
  type: Type.OBJECT,
  properties: {
    isCorrect: {
      type: Type.BOOLEAN,
      description: "True if the user's answer is mathematically equivalent to the correct answer.",
    },
    feedback: {
      type: Type.STRING,
      description: "A short encouraging message. If wrong, give a subtle hint without giving away the full steps yet.",
    },
    fullSolution: {
      type: Type.STRING,
      description: "The full step-by-step symbolic derivation with vertical spacing. Use symbols like ∂, ∇, · clearly.",
    },
    keyPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Important takeaways for this problem.",
    },
  },
  required: ["isCorrect", "feedback", "fullSolution", "keyPoints"],
};

export async function calculatePartialDerivative(
  func: string,
  variable: 'x' | 'y' | 'z',
  point: { x: string; y: string; z?: string },
  varCount: VarCount
): Promise<DerivativeResult> {
  const vars = varCount === 2 ? 'x, y' : 'x, y, z';
  const hasPoint = point.x.trim() !== '' || point.y.trim() !== '' || (point.z && point.z.trim() !== '');
  const pointStr = hasPoint 
    ? `evaluated at the point (x=${point.x || '?'}, y=${point.y || '?'}${varCount === 3 ? `, z=${point.z || '?'}` : ''})`
    : `as a general symbolic expression f_${variable}(${vars})`;
  
  const prompt = `Calculate the partial derivative of f(${vars}) = ${func} with respect to ${variable}. 
  Provide the result ${pointStr}.
  
  STRICT RULES:
  1. Output the final answer in symbolic math notation.
  2. For the 'fullSolution', show every symbolic step (Power Rule, Chain Rule, etc.).
  3. Add TWO newlines between every major algebraic step for vertical spacing.
  4. Explicitly state which variables are being held constant during the differentiation.
  5. Use Unicode mathematical symbols (∂, f_x, Σ, etc.) where appropriate.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  return JSON.parse(response.text.trim());
}

export async function calculateSecondPartialDerivative(
  func: string,
  firstVar: 'x' | 'y' | 'z',
  secondVar: 'x' | 'y' | 'z',
  point: { x: string; y: string; z?: string },
  varCount: VarCount
): Promise<DerivativeResult> {
  const vars = varCount === 2 ? 'x, y' : 'x, y, z';
  const hasPoint = point.x.trim() !== '' || point.y.trim() !== '' || (point.z && point.z.trim() !== '');
  const pointStr = hasPoint 
    ? `evaluated at the point (x=${point.x || '?'}, y=${point.y || '?'}${varCount === 3 ? `, z=${point.z || '?'}` : ''})`
    : `as a general symbolic expression f_${firstVar}${secondVar}(${vars})`;
  
  const prompt = `Calculate the second-order partial derivative (∂²f / ∂${secondVar}∂${firstVar}) of f(${vars}) = ${func}.
  Provide the result ${pointStr}.
  
  STRICT RULES:
  1. Output the final answer in symbolic math notation (e.g., f_${firstVar}${secondVar} = ...).
  2. For the 'fullSolution', show the first partial derivative step, then show the second differentiation step.
  3. Add TWO newlines between major algebraic steps.
  4. Use Unicode mathematical symbols.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  return JSON.parse(response.text.trim());
}

export async function calculateDirectionalDerivative(
  func: string,
  point: { x: string; y: string; z?: string },
  input: { type: DirectionalInputType; valA: string; valB: string; valC?: string; p2?: { x: string; y: string; z?: string } },
  varCount: VarCount
): Promise<DerivativeResult> {
  const vars = varCount === 2 ? 'x, y' : 'x, y, z';
  const pointStr = varCount === 2 ? `(${point.x}, ${point.y})` : `(${point.x}, ${point.y}, ${point.z})`;
  
  let directionContext = "";
  if (input.type === 'vector') {
    directionContext = `in the direction of the vector v = <${input.valA}, ${input.valB}${varCount === 3 ? `, ${input.valC}` : ''}>`;
  } else if (input.type === 'theta') {
    directionContext = `in the direction of the angle θ = ${input.valA} radians`;
  } else if (input.type === 'points') {
    const p2Str = varCount === 2 ? `(${input.valA}, ${input.valB})` : `(${input.valA}, ${input.valB}, ${input.valC})`;
    directionContext = `in the direction from point P${pointStr} to point Q${p2Str}`;
  }

  const prompt = `Calculate the directional derivative D_u f of f(${vars}) = ${func} at point ${pointStr} ${directionContext}.
  
  STRICT RULES:
  1. Explain that D_u f = ∇f · u.
  2. Show the calculation of the Gradient Vector ∇f at the point.
  3. Show the normalization of the direction vector into a Unit Vector u.
  4. Show the Dot Product step clearly.
  5. Add TWO newlines between every major algebraic step for vertical spacing.
  6. Use symbolic notation (∇, ·, ||v||).`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  return JSON.parse(response.text.trim());
}

export async function evaluatePracticeAnswer(
  problem: string,
  userAnswer: string
): Promise<PracticeFeedback> {
  const prompt = `Evaluate the following calculus practice problem answer.
  Problem: ${problem}
  User's Answer: ${userAnswer}
  
  STRICT RULES for Output:
  1. isCorrect: Boolean based on mathematical equivalence.
  2. feedback: Encouraging, short feedback.
  3. fullSolution: Extremely neat, step-by-step derivation. Use TWO newlines between every step. Use symbolic notation (∂, ∇, dot product, etc.).
  4. keyPoints: 3-4 short, clear takeaways.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: feedbackSchema,
    },
  });

  return JSON.parse(response.text.trim());
}
