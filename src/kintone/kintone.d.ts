declare namespace kintone {
  namespace events {
    interface RecordIndexShowEvent {
      type: 'app.record.index.show' | 'mobile.app.record.index.show';
      appId: number;
      viewId: number;
      records: kintone.types.SavedFields[];
    }

    interface RecordDetailShowEvent {
      type: 'app.record.detail.show' | 'mobile.app.record.detail.show';
      appId: number;
      recordId: number;
      record: kintone.types.SavedFields;
    }

    interface RecordCreateShowEvent {
      type: 'app.record.create.show' | 'mobile.app.record.create.show';
      appId: number;
      record: kintone.types.Fields;
    }

    interface RecordEditShowEvent {
      type: 'app.record.edit.show' | 'mobile.app.record.edit.show';
      appId: number;
      record: kintone.types.Fields;
      recordId: number;
    }

    interface RecordCreateSubmitEvent {
      type: 'app.record.create.submit' | 'mobile.app.record.create.submit';
      appId: number;
      record: kintone.types.Fields;
    }

    interface RecordEditSubmitEvent {
      type: 'app.record.edit.submit' | 'mobile.app.record.edit.submit';
      appId: number;
      record: kintone.types.Fields;
      recordId: number;
    }

    type Event =
      | RecordIndexShowEvent
      | RecordDetailShowEvent
      | RecordCreateShowEvent
      | RecordEditShowEvent
      | RecordCreateSubmitEvent
      | RecordEditSubmitEvent;

    type EventMap = {
      [E in Event as E['type']]: E;
    };

    type Handler<T extends Event> = (event: T) => T | Promise<T>;

    function on<T extends keyof EventMap>(
      type: T | T[],
      handler: Handler<EventMap[T]>
    ): void;

    function off<T extends keyof EventMap>(
      type?: T | T[],
      handler?: Handler<EventMap[T]>
    ): boolean;
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
    beforeClose?: (
      action: 'OK' | 'CANCEL' | 'CLOSE'
    ) => boolean | Promise<boolean>;
  };
  type DialogHandler = {
    show: () => Promise<'OK' | 'CANCEL' | 'CLOSE' | 'FUNCTION'>;
    close: () => void;
  };
  function createDialog(config: DialogOptions): Promise<DialogHandler>;
}
