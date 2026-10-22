// The icon a BPMN element is drawn with, wherever it is drawn: in its shape on
// the diagram, on its marker in a path walked.

const TASK_ICONS: Record<string, string> = {
  userTask: 'ph:bold/user',
  manualTask: 'ph:bold/hand',
  serviceTask: 'ph:bold/gear',
  sendTask: 'ph:fill/envelope-simple',
  receiveTask: 'ph:bold/envelope-simple',
  scriptTask: 'ph:bold/scroll',
  businessRuleTask: 'ph:bold/table',
  task: 'ph:bold/square',
  subProcess: 'ph:bold/plus-square',
  callActivity: 'ph:bold/arrow-square-out'
};

const GATEWAY_ICONS: Record<string, string> = {
  exclusiveGateway: 'ph:bold/x',
  parallelGateway: 'ph:bold/plus',
  inclusiveGateway: 'ph:bold/circle',
  eventBasedGateway: 'ph:bold/pentagon',
  complexGateway: 'ph:bold/asterisk'
};

// What an event waits for, and what it sends: thrown, the icon is filled.
const DEFINITION_ICONS: Record<string, [string, string]> = {
  messageEventDefinition: ['ph:bold/envelope-simple', 'ph:fill/envelope-simple'],
  timerEventDefinition: ['ph:bold/clock', 'ph:bold/clock'],
  signalEventDefinition: ['ph:bold/triangle', 'ph:fill/triangle'],
  errorEventDefinition: ['ph:bold/lightning', 'ph:fill/lightning'],
  escalationEventDefinition: ['ph:bold/arrow-fat-up', 'ph:fill/arrow-fat-up'],
  conditionalEventDefinition: ['ph:bold/list-bullets', 'ph:bold/list-bullets'],
  compensateEventDefinition: ['ph:bold/rewind', 'ph:fill/rewind'],
  terminateEventDefinition: ['ph:fill/circle', 'ph:fill/circle']
};

// An event with nothing to wait for or send: what it is in the flow.
const EVENT_ICONS: Record<string, string> = {
  startEvent: 'ph:bold/play-circle',
  endEvent: 'ph:bold/stop-circle',
  intermediateCatchEvent: 'ph:bold/circle-dashed',
  intermediateThrowEvent: 'ph:bold/circle-dashed',
  boundaryEvent: 'ph:bold/circle-dashed'
};

const THROWING = ['intermediateThrowEvent', 'endEvent'];

// `bare` leaves out what the shape already says on the diagram: an event's
// circle needs no icon when nothing is waited for.
export function bpmnElementIcon(element: string, definitions: string[] = [], bare = false): string | null {
  if (TASK_ICONS[element]) {
    return TASK_ICONS[element];
  }

  if (GATEWAY_ICONS[element]) {
    return GATEWAY_ICONS[element];
  }

  const icons = DEFINITION_ICONS[definitions[0]];

  if (icons) {
    return icons[THROWING.includes(element) ? 1 : 0];
  }

  return bare ? null : (EVENT_ICONS[element] ?? null);
}
