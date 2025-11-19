import { FRAMEWORK_TEMPLATES } from '@/data/templates';
import { FrameworkTemplate } from '@/types';

interface TemplatesViewProps {
  onBack: () => void;
  onSelectTemplate?: (template: FrameworkTemplate) => void;
}

export const TemplatesView = ({ onBack, onSelectTemplate }: TemplatesViewProps) => {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold">Framework Templates</h1>
            <p className="text-slate-400 mt-1">Quick-start structures for common case types</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FRAMEWORK_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">{template.name}</h3>
                  <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-full">
                    {template.caseType}
                  </span>
                </div>
              </div>

              <p className="text-slate-400 text-sm mb-4">{template.description}</p>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <span className="material-symbols-rounded text-blue-400 text-lg">account_tree</span>
                  Structure
                </h4>
                <div className="bg-slate-900/50 rounded-lg p-3 font-mono text-xs text-slate-300 space-y-1">
                  {template.structure.map((line, i) => (
                    <div key={i} className={line.startsWith('   ') ? 'ml-4 text-slate-400' : 'font-semibold'}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <span className="material-symbols-rounded text-yellow-400 text-lg">lightbulb</span>
                  Key Tips
                </h4>
                <ul className="space-y-1.5">
                  {template.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {onSelectTemplate && (
                <button
                  onClick={() => onSelectTemplate(template)}
                  className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
                >
                  Use This Framework
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
