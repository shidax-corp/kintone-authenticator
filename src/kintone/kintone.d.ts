declare namespace kintone {
  namespace events {
    type RecordIndexShowEventType =
      | 'app.record.index.show'
      | 'mobile.app.record.index.show';
    interface RecordIndexShowEvent {
      type: RecordIndexShowEventType;
      appId: number;
      viewId: number;
      records: kintone.types.SavedFields[];
    }

    type RecordDetailShowEventType =
      | 'app.record.detail.show'
      | 'mobile.app.record.detail.show';
    interface RecordDetailShowEvent {
      type: RecordDetailShowEventType;
      appId: number;
      recordId: number;
      record: kintone.types.SavedFields;
    }

    type RecordCreateShowEventType =
      | 'app.record.create.show'
      | 'mobile.app.record.create.show';
    interface RecordCreateShowEvent {
      type: RecordCreateShowEventType;
      appId: number;
      record: kintone.types.Fields;
    }

    type RecordEditShowEventType =
      | 'app.record.edit.show'
      | 'mobile.app.record.edit.show';
    interface RecordEditShowEvent extends RecordCreateShowEvent {
      recordId: number;
    }

    type RecordCreateSubmitEventType =
      | 'app.record.create.submit'
      | 'mobile.app.record.create.submit';
    interface RecordCreateSubmitEvent {
      type: RecordCreateSubmitEventType;
      appId: number;
      record: kintone.types.Fields;
    }

    type RecordEditSubmitEventType =
      | 'app.record.edit.submit'
      | 'mobile.app.record.edit.submit';
    interface RecordEditSubmitEvent extends RecordCreateSubmitEvent {
      recordId: number;
    }

    type Event = {
      type:
        | RecordIndexShowEventType
        | RecordDetailShowEventType
        | RecordCreateShowEventType
        | RecordEditShowEventType
        | RecordCreateSubmitEventType
        | RecordEditSubmitEventType;
    };
    type EventHandler<T extends Event> =
      | ((event: T) => T)
      | ((event: T) => Promise<T>);

    function on(
      eventTypes: RecordIndexShowEventType | RecordIndexShowEventType[],
      handler: EventHandler<RecordIndexShowEvent>
    ): void;
    function on(
      eventTypes: RecordDetailShowEventType | RecordDetailShowEventType[],
      handler: EventHandler<RecordDetailShowEvent>
    ): void;
    function on(
      eventTypes: RecordCreateShowEventType | RecordCreateShowEventType[],
      handler: EventHandler<RecordCreateShowEvent>
    ): void;
    function on(
      eventTypes: RecordEditShowEventType | RecordEditShowEventType[],
      handler: EventHandler<RecordEditShowEvent>
    ): void;
    function on(
      eventTypes: RecordCreateSubmitEventType | RecordCreateSubmitEventType[],
      handler: EventHandler<RecordCreateSubmitEvent>
    ): void;
    function on(
      eventTypes: RecordEditSubmitEventType | RecordEditSubmitEventType[],
      handler: EventHandler<RecordEditSubmitEvent>
    ): void;
  }

  namespace app {
    function getId(): number;
    function getHeaderSpaceElement(): HTMLDivElement | null;
    function getQuery(): string;
    function getQueryCondition(): string;

    namespace record {
      function getFieldElement(fieldCode: string): HTMLDivElement | null;
      function getSpaceElement(spaceId: string): HTMLDivElement | null;
      function setFieldShown(fieldCode: string, isShown: boolean): void;
      function get(): {
        record: kintone.types.Fields | kintone.types.SavedFields;
      };
      function set(params: { record: kintone.types.Fields }): Promise<void>;
    }
  }

  namespace mobile {
    namespace app {
      function getHeaderSpaceElement(): HTMLDivElement | null;
      function getQueryCondition(): string;

      namespace record {
        function getSpaceElement(spaceId: string): HTMLDivElement | null;
        function setFieldShown(fieldCode: string, isShown: boolean): void;
        function get(): {
          record: kintone.types.Fields | kintone.types.SavedFields;
        };
        function set(params: { record: kintone.types.Fields }): Promise<void>;
      }
    }
  }

  function api(
    pathOrUrl: '/k/v1/records/cursor.json',
    method: 'POST',
    params: {
      app: number | string;
      fields?: string[];
      query?: string;
      size?: number | string;
    }
  ): Promise<{ id: string; totalCount: number }>;
  function api(
    pathOrUrl: '/k/v1/records/cursor.json',
    method: 'GET',
    params: { id: string }
  ): Promise<{ records: kintone.types.SavedFields[]; next: boolean }>;
  function api(
    pathOrUrl: '/k/v1/records/cursor.json',
    method: 'DELETE',
    params: { id: string }
  ): Promise<{ [key: string]: never }>;
  function api(
    pathOrUrl: string,
    method: string,
    params: Record<string, any>
  ): Promise<Record<string, any>>;

  type DialogOptions = {
    title?: string;
    body?: HTMLElement;
    showOkButton?: boolean;
    okButtonText?: string;
    showCancelButton?: boolean;
    cancelButtonText?: string;
    showCloseButton?: boolean;
    beforeClose?: () => boolean | Promise<boolean>;
  };
  type DialogHandler = {
    show: () => Promise<'OK' | 'CANCEL' | 'CLOSE' | 'FUNCTION'>;
    close: () => void;
  };
  function createDialog(config: DialogOptions): Promise<DialogHandler>;
}
