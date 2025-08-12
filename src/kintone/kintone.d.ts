declare namespace kintone {
  namespace events {
    interface RecordIndexShowEvent {
      appId: number;
      viewId: number;
      records: kintone.types.SavedFields[];
    }
    type RecordIndexShowEventType = 'app.record.index.show' | 'mobile.app.record.index.show';
    function on(eventTypes: RecordIndexShowEventType | RecordIndexShowEventType[], handler: (event: RecordIndexShowEvent) => any): void;
  }
  namespace app {
    function getHeaderSpaceElement(): HTMLElement;
  }
}
