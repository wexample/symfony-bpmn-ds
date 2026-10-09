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
    }
  },

  data() {
    return {
      lanes: [],
      nodes: [],
      flows: [],
      loading: true,
      failed: false
    };
  },

  computed: {
    regions() {
      return this.lanes.map((lane) => ({
        id: lane.laneId,
        title: lane.name || lane.laneId,
        kind: lane.depth > 0 ? 'nested' : null,
        x: lane.x,
        y: lane.y,
        width: lane.width,
        height: lane.height
      }));
    },

    elements() {
      return this.nodes.map((node) => ({
        id: node.nodeId,
        title: node.name,
        kind: node.kind,
        element: node.element,
        definitions: node.definitions ?? [],
        attached: Boolean(node.attachedTo),
        x: node.x,
        y: node.y,
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
        kind: flow.isDefault ? 'default' : (flow.condition ? 'conditional' : null),
        points: flow.points?.length ? flow.points : null
      }));
    },

    // The bands are the whole height: the stage stands as tall as they do,
    // and moves only sideways.
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
