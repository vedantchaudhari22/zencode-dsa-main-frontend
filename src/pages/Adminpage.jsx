// Adminpage is the content authoring surface for new practice problems.
// It is intentionally form-heavy because it captures everything the judge and UI need later.
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import axiosClient from "../utils/axiosClient";
import Navbar from "../components/Navbar";

const adminSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  companies: z
    .string()
    .transform((val) =>
      val.split(",").map(c => c.trim()).filter(Boolean)
    )
    .refine(arr => arr.length > 0, "At least one company required"),
  description: z.string().trim().min(1),
  difficulty: z.string().min(1),
  tags: z.preprocess(
    (val) => (Array.isArray(val) ? val : typeof val === "string" ? [val] : []),
    z.array(z.string()).min(1, "At least one tag required")
  ),
  hints: z.preprocess(
    (val) => (Array.isArray(val) ? val.map((v) => String(v)) : []),
    z.array(z.string())
  ),
  constraints: z.string().trim().min(1),
  examples: z
    .array(
      z.object({
        input: z.string().trim().min(1, "Input required"),
        output: z.string().trim().min(1, "Output required"),
        explanation: z.string().optional().default("")
      })
    )
    .min(1, "At least one example required"),
  testCases: z
    .array(
      z.object({
        input: z.string().trim().min(1, "Input required"),
        expectedOutput: z.string().trim().min(1, "Expected output required"),
      })
    )
    .min(1, "At least one test case required"),
  initialCode: z
    .array(
      z.object({
        language: z.string().trim().min(1, "Language required"),
        code: z.string().trim().min(1, "Code required"),
      })
    )
    .min(1, "At least one language code required"),
  driverCode: z
    .array(
      z.object({
        language: z.string().trim().min(1, "Language required"),
        prefix: z.string().optional().default(""),
        suffix: z.string().optional().default(""),
      })
    )
    .optional()
    .default([]),
  editorial: z.string().optional().default(""),
  referenceSolution: z
    .array(
      z.object({
        language: z.string().trim().min(1, "Language required"),
        solution: z.string().trim().min(1, "Solution required"),
      })
    )
    .optional()
    .default([]),
});

const TAG_OPTIONS = [
  "array", "binary-search", "linked-list", "stack", "hash-table",
  "sorting", "tree", "graph", "dynamic-programming", "greedy",
  "backtracking", "recursion", "sliding-window", "two-pointers", "math"
];

export default function Adminpage() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      title: "",
      companies: "",
      description: "",
      difficulty: "easy",
      tags: [],
      hints: [],
      constraints: "",
      examples: [{ input: "", output: "", explanation: "" }],
      testCases: [{ input: "", expectedOutput: "" }],
      initialCode: [{ language: "cpp", code: "" }],
      driverCode: [{ language: "cpp", prefix: "", suffix: "" }],
      editorial: "",
      referenceSolution: [],
    },
  });

  const {
    fields: exampleFields,
    append: appendExample,
    remove: removeExample,
  } = useFieldArray({ control, name: "examples" });

  const {
    fields: testCaseFields,
    append: appendTestCase,
    remove: removeTestCase,
  } = useFieldArray({ control, name: "testCases" });

  const {
    fields: hintFields,
    append: appendHint,
    remove: removeHint,
  } = useFieldArray({ control, name: "hints" });

  const {
    fields: codeFields,
    append: appendCode,
    remove: removeCode,
  } = useFieldArray({ control, name: "initialCode" });

  const {
    fields: driverFields,
    append: appendDriver,
    remove: removeDriver,
  } = useFieldArray({ control, name: "driverCode" });

  const {
    fields: refSolFields,
    append: appendRefSol,
    remove: removeRefSol,
  } = useFieldArray({ control, name: "referenceSolution" });

  const onSubmit = async (data) => {
    try {
      await axiosClient.post("/problem/create", data);
      reset();
      alert("Problem created!");
    } catch (e) {
      console.error(e);
      alert("Error creating problem");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-indigo-500/20 pb-24">
      <Navbar />

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/30 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-200/30 blur-[150px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 pt-24 relative z-10">
        <h1 className="text-4xl font-semibold text-center mb-4 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 bg-clip-text text-transparent">
          Admin Panel
        </h1>
        <p className="text-center text-slate-500 mb-10">Create and manage problems for ZenCode.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">

          {/* Basic Info */}
          <section className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-lg font-semibold border-l-4 border-indigo-500 pl-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Title</label>
                <input
                  {...register("title")}
                  className="mt-2 w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                  placeholder="Problem Title"
                />
                <p className="text-red-400 text-xs mt-1">{errors.title?.message}</p>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Companies (comma separated)</label>
                <input
                  {...register("companies")}
                  className="mt-2 w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                  placeholder="Google, Amazon"
                />
                <p className="text-red-400 text-xs mt-1">{errors.companies?.message}</p>
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Description</label>
              <textarea
                {...register("description")}
                rows={4}
                className="mt-2 w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                placeholder="Problem description (supports markdown)"
              />
              <p className="text-red-400 text-xs mt-1">{errors.description?.message}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Difficulty</label>
                <select
                  {...register("difficulty")}
                  className="mt-2 w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Constraints</label>
                <input
                  {...register("constraints")}
                  className="mt-2 w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                  placeholder="e.g. 1 ≤ n ≤ 10^5"
                />
                <p className="text-red-400 text-xs mt-1">{errors.constraints?.message}</p>
              </div>
            </div>
          </section>

          {/* Tags */}
          <section className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold border-l-4 border-red-500 pl-4">Tags</h2>
            <div className="flex flex-wrap gap-3">
              {TAG_OPTIONS.map((tag) => (
                <label
                  key={tag}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-indigo-300 transition-colors"
                >
                  <input
                    type="checkbox"
                    {...register("tags")}
                    value={tag}
                    className="h-4 w-4 rounded border-slate-300 bg-white text-indigo-500 focus:ring-indigo-400"
                  />
                  <span className="text-sm">{tag}</span>
                </label>
              ))}
            </div>
            <p className="text-red-400 text-xs mt-1">{errors.tags?.message}</p>
          </section>

          {/* Hints */}
          <section className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold border-l-4 border-amber-500 pl-4">Hints</h2>
            {hintFields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-center">
                <input
                  {...register(`hints.${index}`)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                  placeholder={`Hint ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeHint(index)}
                  className="text-rose-400 hover:text-rose-300 text-sm font-semibold"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => appendHint("")}
              className="text-indigo-500 hover:text-indigo-600 text-sm font-semibold"
            >
              + Add Hint
            </button>
          </section>

          {/* Examples */}
          <section className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold border-l-4 border-emerald-500 pl-4">Examples</h2>
            {exampleFields.map((field, index) => (
              <div key={field.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Example {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeExample(index)}
                    className="text-rose-400 hover:text-rose-300 text-sm font-semibold"
                  >
                    Remove
                  </button>
                </div>
                <input
                  {...register(`examples.${index}.input`)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                  placeholder="Input"
                />
                <input
                  {...register(`examples.${index}.output`)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                  placeholder="Output"
                />
                <input
                  {...register(`examples.${index}.explanation`)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                  placeholder="Explanation (optional)"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => appendExample({ input: "", output: "", explanation: "" })}
              className="text-indigo-500 hover:text-indigo-600 text-sm font-semibold"
            >
              + Add Example
            </button>
            <p className="text-red-400 text-xs mt-1">{errors.examples?.message}</p>
          </section>

          {/* Test Cases */}
          <section className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold border-l-4 border-rose-500 pl-4">Test Cases</h2>
            {testCaseFields.map((field, index) => (
              <div key={field.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Test Case {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeTestCase(index)}
                    className="text-rose-400 hover:text-rose-300 text-sm font-semibold"
                  >
                    Remove
                  </button>
                </div>
                <input
                  {...register(`testCases.${index}.input`)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                  placeholder="Input"
                />
                <input
                  {...register(`testCases.${index}.expectedOutput`)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                  placeholder="Expected Output"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => appendTestCase({ input: "", expectedOutput: "" })}
              className="text-indigo-500 hover:text-indigo-600 text-sm font-semibold"
            >
              + Add Test Case
            </button>
            <p className="text-red-400 text-xs mt-1">{errors.testCases?.message}</p>
          </section>

          {/* Initial Code */}
          <section className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold border-l-4 border-indigo-500 pl-4">Initial Code Templates</h2>
            {codeFields.map((field, index) => (
              <div key={field.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Language {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeCode(index)}
                    className="text-rose-400 hover:text-rose-300 text-sm font-semibold"
                  >
                    Remove
                  </button>
                </div>
                <select
                  {...register(`initialCode.${index}.language`)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                >
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                </select>
                <textarea
                  {...register(`initialCode.${index}.code`)}
                  rows={4}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 font-mono text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                  placeholder="Starter code..."
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => appendCode({ language: "cpp", code: "" })}
              className="text-indigo-500 hover:text-indigo-600 text-sm font-semibold"
            >
              + Add Language
            </button>
            <p className="text-red-400 text-xs mt-1">{errors.initialCode?.message}</p>
          </section>

          {/* Driver Code (main/IO boilerplate) */}
          <section className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold border-l-4 border-violet-500 pl-4">Driver Code (Judge0 Wrapper)</h2>
            <p className="text-xs text-neutral-500">The user's code is sandwiched between <strong>prefix</strong> and <strong>suffix</strong>. The suffix should contain main() that reads stdin, calls the Solution method, and prints to stdout.</p>
            {driverFields.map((field, index) => (
              <div key={field.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Driver {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeDriver(index)}
                    className="text-rose-400 hover:text-rose-300 text-sm font-semibold"
                  >
                    Remove
                  </button>
                </div>
                <select
                  {...register(`driverCode.${index}.language`)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                >
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                </select>
                <div>
                  <label className="text-xs text-neutral-500">Prefix (includes, headers — added BEFORE user code)</label>
                  <textarea
                    {...register(`driverCode.${index}.prefix`)}
                    rows={3}
                    className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 font-mono text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                    placeholder="#include <bits/stdc++.h>&#10;using namespace std;"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500">Suffix (main function — added AFTER user code)</label>
                  <textarea
                    {...register(`driverCode.${index}.suffix`)}
                    rows={8}
                    className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 font-mono text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                    placeholder="int main() {&#10;    // read stdin, call Solution, print result&#10;}"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => appendDriver({ language: "cpp", prefix: "", suffix: "" })}
              className="text-indigo-500 hover:text-indigo-600 text-sm font-semibold"
            >
              + Add Driver Code
            </button>
            <p className="text-red-400 text-xs mt-1">{errors.driverCode?.message}</p>
          </section>

          {/* Editorial */}
          <section className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold border-l-4 border-emerald-500 pl-4">Editorial (Optional)</h2>
            <textarea
              {...register("editorial")}
              rows={6}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all font-mono text-sm"
              placeholder="Write the editorial in Markdown. Explain the optimal approach, time/space complexity, etc."
            />
          </section>

          {/* Reference Solutions (Optional) */}
          <section className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold border-l-4 border-cyan-500 pl-4">Reference Solutions (Optional)</h2>
            <p className="text-xs text-neutral-500">If provided, solutions will be validated against test cases via Judge0 before saving.</p>
            {refSolFields.map((field, index) => (
              <div key={field.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Solution {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeRefSol(index)}
                    className="text-rose-400 hover:text-rose-300 text-sm font-semibold"
                  >
                    Remove
                  </button>
                </div>
                <select
                  {...register(`referenceSolution.${index}.language`)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                >
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                </select>
                <textarea
                  {...register(`referenceSolution.${index}.solution`)}
                  rows={6}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 font-mono text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                  placeholder="Full working solution..."
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => appendRefSol({ language: "cpp", solution: "" })}
              className="text-orange-400 hover:text-orange-300 text-sm font-semibold"
            >
              + Add Reference Solution
            </button>
          </section>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-lg rounded-2xl shadow-xl transition-all"
          >
            Create Problem
          </button>
        </form>
      </div>
    </div>
  );
}
