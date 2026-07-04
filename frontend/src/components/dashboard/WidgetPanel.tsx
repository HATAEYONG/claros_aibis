import React, { useState, DragEvent } from 'react';
import { useWidgets, Widget } from '@/context/WidgetContext';
import {
  PlusIcon,
  MinusIcon,
  XIcon,
  EditIcon,
  SaveIcon,
  LayoutIcon,
  GridIcon
} from '@/components/icons/Icons';

interface WidgetPanelProps {
  renderWidget: (widget: Widget) => React.ReactNode;
}

const WidgetPanel: React.FC<WidgetPanelProps> = ({ renderWidget }) => {
  const {
    widgets,
    templates,
    activeTemplate,
    isEditMode,
    setEditMode,
    removeWidget,
    updateWidget,
    reorderWidgets,
    toggleWidgetVisibility,
    toggleWidgetMinimized,
    saveTemplate,
    loadTemplate,
    resetToDefault
  } = useWidgets();

  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const handleDragStart = (e: DragEvent<HTMLDivElement>, widgetId: string) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetWidgetId: string) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetWidgetId) return;

    const draggedIndex = widgets.findIndex(w => w.id === draggedWidget);
    const targetIndex = widgets.findIndex(w => w.id === targetWidgetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, removed);

    reorderWidgets(newWidgets);
    setDraggedWidget(null);
  };

  const handleSaveTemplate = () => {
    if (templateName.trim()) {
      saveTemplate(templateName, templateDescription, 'custom');
      setShowSaveDialog(false);
      setTemplateName('');
      setTemplateDescription('');
    }
  };

  const getWidgetSizeClass = (size: Widget['size']) => {
    switch (size) {
      case 'small': return 'col-span-1 row-span-1';
      case 'medium': return 'col-span-1 row-span-2';
      case 'large': return 'col-span-2 row-span-2';
      case 'wide': return 'col-span-2 row-span-1';
      default: return 'col-span-1 row-span-1';
    }
  };

  const visibleWidgets = widgets.filter(w => w.visible);

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode(!isEditMode)}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                isEditMode
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <EditIcon size={18} />
              {isEditMode ? '편집 완료' : '위젯 편집'}
            </button>

            {isEditMode && (
              <>
                <button
                  onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                  className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  <LayoutIcon size={18} />
                  템플릿
                </button>

                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  <SaveIcon size={18} />
                  저장
                </button>

                <button
                  onClick={resetToDefault}
                  className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  <GridIcon size={18} />
                  초기화
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            {activeTemplate && (
              <span>현재: {templates.find(t => t.id === activeTemplate)?.name || '사용자 정의'}</span>
            )}
            <span>위젯: {visibleWidgets.length}개</span>
          </div>
        </div>

        {/* Template Selector */}
        {showTemplateSelector && isEditMode && (
          <div className="mt-4 pt-4 border-t dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">템플릿 선택</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    loadTemplate(template.id);
                    setShowTemplateSelector(false);
                  }}
                  className={`p-3 rounded-lg text-left transition-all ${
                    activeTemplate === template.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                      : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{template.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save Template Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">대시보드 템플릿 저장</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  템플릿 이름
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="예: 영업팀 대시보드"
                  className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설명
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="템플릿에 대한 설명을 입력하세요"
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setTemplateName('');
                    setTemplateDescription('');
                  }}
                  className="px-4 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim()}
                  className="px-4 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-min">
        {visibleWidgets.map((widget) => (
          <div
            key={widget.id}
            draggable={isEditMode}
            onDragStart={(e) => handleDragStart(e, widget.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, widget.id)}
            className={`relative ${getWidgetSizeClass(widget.size)} ${
              isEditMode ? 'cursor-move' : ''
            }`}
          >
            {/* Edit Mode Controls */}
            {isEditMode && (
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                <button
                  onClick={() => toggleWidgetMinimized(widget.id)}
                  className="p-1.5 rounded bg-white dark:bg-gray-700 shadow hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
                  title={widget.minimized ? '펼치기' : '접기'}
                >
                  {widget.minimized ? <PlusIcon size={16} /> : <MinusIcon size={16} />}
                </button>
                <button
                  onClick={() => toggleWidgetVisibility(widget.id)}
                  className="p-1.5 rounded bg-white dark:bg-gray-700 shadow hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
                  title="숨기기"
                >
                  <XIcon size={16} />
                </button>
              </div>
            )}

            {/* Widget Content */}
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow p-4 h-full transition-all ${
              widget.minimized ? 'opacity-60' : ''
            } ${isEditMode ? 'ring-2 ring-dashed ring-blue-300 dark:ring-blue-700' : ''}`}>
              {renderWidget(widget)}
            </div>
          </div>
        ))}

        {/* Add Widget Button (Edit Mode) */}
        {isEditMode && (
          <div className="col-span-1 row-span-1">
            <button className="w-full h-full min-h-[140px] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 transition-all flex flex-col items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-500">
              <PlusIcon size={32} />
              <span className="text-sm font-medium">위젯 추가</span>
            </button>
          </div>
        )}
      </div>

      {/* Hidden Widgets (Edit Mode) */}
      {isEditMode && widgets.filter(w => !w.visible).length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">숨겨진 위젯</p>
          <div className="flex flex-wrap gap-2">
            {widgets.filter(w => !w.visible).map((widget) => (
              <button
                key={widget.id}
                onClick={() => toggleWidgetVisibility(widget.id)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
              >
                {widget.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WidgetPanel;
