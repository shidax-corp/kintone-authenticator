declare namespace kintone {
  namespace events {
    type RecordIndexShowEventType = 'app.record.index.show' | 'mobile.app.record.index.show';
    interface RecordIndexShowEvent {
      type: RecordIndexShowEventType;
      appId: number;
      viewId: number;
      records: kintone.types.SavedFields[];
    }
    function on(eventTypes: RecordIndexShowEventType | RecordIndexShowEventType[], handler: (event: RecordIndexShowEvent) => RecordIndexShowEvent): void;

    type RecordDetailShowEventType = 'app.record.detail.show' | 'mobile.app.record.detail.show';
    interface RecordDetailShowEvent {
      type: RecordDetailShowEventType;
      appId: number;
      recordId: number;
      record: kintone.types.SavedFields;
    }
    function on(eventTypes: RecordDetailShowEventType | RecordDetailShowEventType[], handler: (event: RecordDetailShowEvent) => RecordDetailShowEvent): void;
  }

  namespace app {
    function getHeaderSpaceElement(): HTMLDivElement | null;

    namespace record {
      function getFieldElement(fieldCode: string): HTMLDivElement | null;
      function getSpaceElement(spaceId: string): HTMLDivElement | null;
      function setFieldShown(fieldCode: string, isShown: boolean): void;
    }
  }
}
