<script>
import BpmnDiagram from '../bpmn-diagram/bpmn-diagram.vue';
import BpmnPathWalk from '../bpmn-path-walk/bpmn-path-walk.vue';

const T = 'WexampleSymfonyBpmnDsBundle.components.bpmn-process.bpmn-process::';

// A process read: its diagram, a path walked on it, and what the node pressed
// is — its kind, who acts at it, what its documentation says — in the bar
// under the diagram.
export default {
  template: '#vue-template-wexample-symfony-bpmn-ds-bundle-components-bpmn-process-bpmn-process',

  components: {
    BpmnDiagram,
    BpmnPathWalk
  },

  props: {
    process: {
      type: String,
      required: true
    }
  },

  data() {
    return {
      lanes: [],
      nodes: [],
      highlighted: [],
      selection: []
    };
  },

  computed: {
    picked() {
      return this.selection.length === 1
        ? this.nodes.find((node) => node.nodeId === this.selection[0]) ?? null
        : null;
    },

    status() {
      const node = this.picked;

      if (!node) {
        return this.t('hint');
      }

      const lane = this.lanes.find((candidate) => candidate.laneId === node.laneId);
      const parts = [
        node.name || node.nodeId,
        this.trans(`WexampleSymfonyBpmnDsBundle.components.bpmn-diagram.bpmn-diagram::element.${node.element}`),
        lane ? (lane.name || lane.laneId) : null,
        node.documentation
      ];

      return parts.filter(Boolean).join(' · ');
    }
  },

  methods: {
    t(key, parameters = {}) {
      return this.trans(`${T}${key}`, parameters);
    },

    onLoaded({ lanes, nodes }) {
      this.lanes = lanes;
      this.nodes = nodes;
    }
  }
};
</script>
