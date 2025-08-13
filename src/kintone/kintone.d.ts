declare namespace kintone {
  namespace events {
    type RecordIndexShowEventType = 'app.record.index.show' | 'mobile.app.record.index.show';
    interface RecordIndexShowEvent {
      type: RecordIndexShowEventType;
      appId: number;
      viewId: number;
      records: kintone.types.SavedFields[];
    }

    type RecordDetailShowEventType = 'app.record.detail.show' | 'mobile.app.record.detail.show';
    interface RecordDetailShowEvent {
      type: RecordDetailShowEventType;
      appId: number;
      recordId: number;
      record: kintone.types.SavedFields;
    }

    type RecordCreateShowEventType = 'app.record.create.show' | 'mobile.app.record.create.show';
    interface RecordCreateShowEvent {
      type: RecordCreateShowEventType;
      appId: number;
      record: kintone.types.Fields;
    }

    type RecordEditShowEventType = 'app.record.edit.show' | 'mobile.app.record.edit.show';
    interface RecordEditShowEvent {
      type: RecordEditShowEventType;
      appId: number;
      recordId: number;
      record: kintone.types.SavedFields;
    }

    type RecordCreateSubmitEventType = 'app.record.create.submit' | 'mobile.app.record.create.submit';
    interface RecordCreateSubmitEvent {
      type: RecordCreateSubmitEventType;
      appId: number;
      record: kintone.types.Fields;
    }

    type RecordEditSubmitEventType = 'app.record.edit.submit' | 'mobile.app.record.edit.submit';
    interface RecordEditSubmitEvent {
      type: RecordEditSubmitEventType;
      appId: number;
      recordId: number;
      record: kintone.types.SavedFields;
    }

    function on(eventTypes: RecordIndexShowEventType | RecordIndexShowEventType[], handler: (event: RecordIndexShowEvent) => RecordIndexShowEvent): void;
    function on(eventTypes: RecordDetailShowEventType | RecordDetailShowEventType[], handler: (event: RecordDetailShowEvent) => RecordDetailShowEvent): void;
    function on(eventTypes: RecordCreateShowEventType | RecordCreateShowEventType[], handler: (event: RecordCreateShowEvent) => RecordCreateShowEvent): void;
    function on(eventTypes: RecordEditShowEventType | RecordEditShowEventType[], handler: (event: RecordEditShowEvent) => RecordEditShowEvent): void;
    function on(eventTypes: RecordCreateSubmitEventType | RecordCreateSubmitEventType[], handler: (event: RecordCreateSubmitEvent) => RecordCreateSubmitEvent): void;
    function on(eventTypes: RecordEditSubmitEventType | RecordEditSubmitEventType[], handler: (event: RecordEditSubmitEvent) => RecordEditSubmitEvent): void;
  }

  namespace app {
    function getHeaderSpaceElement(): HTMLDivElement | null;

    namespace record {
      function getFieldElement(fieldCode: string): HTMLDivElement | null;
      function getSpaceElement(spaceId: string): HTMLDivElement | null;
      function setFieldShown(fieldCode: string, isShown: boolean): void;
      function set(record: kintone.types.SavedFields): Promise<void>;
    }
  }
}
