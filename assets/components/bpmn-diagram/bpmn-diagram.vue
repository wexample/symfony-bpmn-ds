<script>
import Stage from '@wexample/symfony-stage/components/stage/stage.vue';
import AbstractEntityManipulatorVueMixin from '@wexample/symfony-design-system/js/Vue/AbstractEntityManipulatorVueMixin';
import BpmnLane from '@wexample/symfony-bpmn/Entity/BpmnLane';
import BpmnNode from '@wexample/symfony-bpmn/Entity/BpmnNode';
import BpmnFlow from '@wexample/symfony-bpmn/Entity/BpmnFlow';
import { bpmnElementIcon } from '../../js/Helper/BpmnElementHelper';

const T = 'WexampleSymfonyBpmnDsBundle.components.bpmn-diagram.bpmn-diagram::';

// A process drawn as a timeline: its lanes in bands, its nodes where the
// layout of symfony-bpmn put them, its flows along their routes — moved
// sideways, read only, never zoomed.
//
// Everything is read from the api, a list per entity, through the
// repositories generated from them: the component is given the process's id
// and nothing else. `highlighted` lights nodes and flows by their BPMN ids —
// a path walked —, and a node pressed is handed back (`update:selection`).
// It stands as tall as its lanes, or as what holds it (`fill`): its lanes then
// grow to its height when they are shorter, and it moves down as well as
// sideways when they are taller — never past what it holds.
export default {
  template: '#vue-template-wexample-symfony-bpmn-ds-bundle-components-bpmn-diagram-bpmn-diagram',

  mixins: [AbstractEntityManipulatorVueMixin],

  components: {
    Stage
  },

  emits: ['loaded', 'update:selection'],

  props: {
    process: {
      type: String,
      required: true
    },
    highlighted: {
      type: Array,
      default: () => []
    },
    // The height of what holds it, rather than of its lanes.
    fill: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      lanes: [],
      nodes: [],
      flows: [],
      loading: true,
      failed: false,
      viewHeight: 0
    };
  },

  computed: {
    // The bands that hold nodes: the lanes no other lane is nested in, top
    // first.
    bands() {
      const parents = new Set(this.lanes.map((lane) => lane.parentLaneId).filter(Boolean));

      return this.lanes.filter((lane) => !parents.has(lane.laneId)).sort((a, b) => a.y - b.y);
    },

    // Filling a stage taller than the process, the room left under it is
    // shared between the bands: each grows by as much, what it holds centred
    // in it. Its routes too — those drawn under the lanes stay under them.
    // Where the routes drawn under the lanes end — the flows going back,
    // which the layout runs below every band —, or 0 when none is.
    routesBottom() {
      const below = this.flows.flatMap((flow) => flow.points ?? []).map(([, y]) => y).filter((y) => y > this.height);

      return below.length ? Math.max(...below) + 24 : 0;
    },

    stretch() {
      if (!this.fill || !this.viewHeight || !this.bands.length) {
        return 0;
      }

      return Math.max(0, this.viewHeight - Math.max(this.height, this.routesBottom)) / this.bands.length;
    },

    regions() {
      const lanes = this.lanes.map((lane) => {
        const top = lane.y + this.edgeShift(lane.y);
        const bottom = lane.y + lane.height + this.edgeShift(lane.y + lane.height);

        return {
          id: lane.laneId,
          title: lane.name || lane.laneId,
          kind: lane.depth > 0 ? 'nested' : null,
          x: lane.x,
          y: top,
          width: lane.width,
          height: bottom - top
        };
      });

      if (!this.routesBottom || !lanes.length) {
        return lanes;
      }

      // The routes going back belong to no lane: a band of their own under
      // the lanes, its head empty, so the heads run down to the foot.
      const top = this.height + this.bands.length * this.stretch;
      const bottom = this.stretch ? this.viewHeight : this.routesBottom;

      return [...lanes, {
        id: 'bpmn-returns',
        title: '',
        kind: 'returns',
        x: lanes[0].x,
        y: top,
        width: Math.max(...lanes.map((lane) => lane.width)),
        height: Math.max(0, bottom - top)
      }];
    },

    elements() {
      return this.nodes.map((node) => ({
        id: node.nodeId,
        title: node.name,
        kind: node.kind,
        element: node.element,
        definitions: node.definitions ?? [],
        x: node.x,
        y: node.y + this.shift(node.y + node.height / 2),
        width: node.width,
        height: node.height
      }));
    },

    links() {
      return this.flows.map((flow) => ({
        id: flow.flowId,
        from: flow.sourceId,
        to: flow.targetId,
        label: flow.name || flow.condition || null,
        // A way under a condition dashed, the way when none holds heavier.
        kind: flow.isDefault ? 'strong' : (flow.condition ? 'dashed' : null),
        points: flow.points?.length ? flow.points.map(([x, y]) => [x, y + this.shift(y)]) : null
      }));
    },

    // How tall the lanes are, as laid out.
    height() {
      return this.lanes.reduce((bottom, lane) => Math.max(bottom, lane.y + lane.height), 0);
    }
  },

  watch: {
    process() {
      this.load();
    }
  },

  mounted() {
    this.load();

    if (this.fill) {
      this.observer = new ResizeObserver(([entry]) => {
        this.viewHeight = entry.contentRect.height;
      });
      this.observer.observe(this.$el);
    }
  },

  beforeUnmount() {
    this.observer?.disconnect();
  },

  methods: {
    t(key, parameters = {}) {
      return this.trans(`${T}${key}`, parameters);
    },

    renderIcon(name) {
      return this.app.getServiceOrFail('icon').icon(name);
    },

    async load() {
      const query = { query: { process: this.process } };

      this.loading = true;
      this.failed = false;

      try {
        [this.lanes, this.nodes, this.flows] = await Promise.all([
          this.getEntityRepository(BpmnLane).fetchList(query),
          this.getEntityRepository(BpmnNode).fetchList(query),
          this.getEntityRepository(BpmnFlow).fetchList(query)
        ]);
        this.$emit('loaded', { lanes: this.lanes, nodes: this.nodes, flows: this.flows });
      } catch {
        this.failed = true;
      } finally {
        this.loading = false;
      }
    },

    // How far down what stands at `y` moves when the bands grow: by the growth
    // of the bands above it, and half its own band's, to stay centred in it.
    shift(y) {
      const index = this.bands.findIndex((band) => y >= band.y && y < band.y + band.height);

      if (index >= 0) {
        return (index + 0.5) * this.stretch;
      }

      return y >= this.height ? this.bands.length * this.stretch : 0;
    },

    // How far down an edge of a band moves: by the growth of the bands that
    // end at it or above.
    edgeShift(y) {
      return this.stretch * this.bands.filter((band) => band.y + band.height <= y + 0.5).length;
    },

    // What a node is, as a figure of the stage: its shape, its edge, its tone.
    // A start in the tone of what goes, an end heavier in the tone of what
    // stops, a wait doubled, an interruption doubled in the tone of a warning,
    // a choice in that tone too; a box holding more than itself heavier.
    shapeClass(element) {
      const shape = {
        task: [],
        activity: ['stage-shape--thick'],
        gateway: ['stage-shape--diamond', 'stage-shape--tone-warning'],
        event: ['stage-shape--circle']
      }[element.kind] ?? [];

      const event = {
        startEvent: ['stage-shape--tone-success'],
        endEvent: ['stage-shape--thick', 'stage-shape--tone-error'],
        intermediateCatchEvent: ['stage-shape--double'],
        intermediateThrowEvent: ['stage-shape--double'],
        boundaryEvent: ['stage-shape--double', 'stage-shape--tone-warning']
      }[element.element] ?? [];

      return [...shape, ...event];
    },

    nodeIcon(element) {
      return bpmnElementIcon(element.element, element.definitions, true);
    },

    // What the shape stands for, for whoever does not read BPMN: its title
    // on the pointer, its kind read out.
    nodeLabel(element) {
      const kind = this.t(`element.${element.element}`);

      return element.title ? `${element.title} — ${kind}` : kind;
    }
  }
};
</script>
