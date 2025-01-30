import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const { userInput } = await req.json();
    console.log("The received userInput:", userInput);

    if (!userInput || userInput.trim() === "") {
      return NextResponse.json({ output: [], error: "Input is empty." });
    }

    const prompt = `
      Based on the input, generate a JSON array of calendar events.
      - Each event must have: summary, start, and end fields.
      - Use ISO 8601 format for start and end times.
      - Example format: [{ "summary": "Lunch", "start": "2024-12-19T17:00:00", "end": "2024-12-19T18:00:00" }]
      - Return only the raw JSON array. Do not include any additional text, such as Markdown or explanations.
      - Input: "${userInput}"
    `;
    console.log("The prompt:", prompt);

    const result = await model.generateContent(prompt);
    const output = result?.response?.text?.();
    console.log("The raw output:", output);

    try {
      // const parsedOutput = JSON.parse(output); // Parse the raw JSON from the model
      return NextResponse.json({ output });
    } catch {
      console.error("Model returned invalid JSON:", output);
      return NextResponse.json({
        output: [],
        error: "Model output could not be parsed as JSON.",
      });
    }
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.error();
  }
}
