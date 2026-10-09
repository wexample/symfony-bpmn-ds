<script>
import Properties from '@wexample/symfony-design-system/components/properties/properties.vue';
import Tab from '@wexample/symfony-design-system/components/tab/tab.vue';
import ZoneResizer from '@wexample/symfony-design-system/components/zone-resizer/zone-resizer.vue';
import { uiStateGet, uiStateSet } from '@wexample/symfony-design-system/js/Helper/UiStateHelper';
import BpmnDiagram from '../bpmn-diagram/bpmn-diagram.vue';
import BpmnIssues from '../bpmn-issues/bpmn-issues.vue';
import BpmnPathWalk from '../bpmn-path-walk/bpmn-path-walk.vue';
import BpmnRightsTable from '../bpmn-rights-table/bpmn-rights-table.vue';

const T = 'WexampleSymfonyBpmnDsBundle.components.bpmn-process.bpmn-process::';
const ELEMENT = 'WexampleSymfonyBpmnDsBundle.components.bpmn-diagram.bpmn-diagram::element.';

// The zone of the inspector, whose width the page remembers.
const ASIDE_ZONE = 'bpmn.process.aside';

// A process read as a workspace: its diagram the whole of the room, and on its
// right an inspector the reader widens, in two tabs: what the process is —
// the step pressed, who acts, what its validation says —, and its paths walked
// on the diagram. The tab open is remembered.
export default {
  template: '#vue-template-wexample-symfony-bpmn-ds-bundle-components-bpmn-process-bpmn-process',

  components: {
    BpmnDiagram,
    BpmnIssues,
    BpmnPathWalk,
    BpmnRightsTable,
    Properties,
    Tab,
    ZoneResizer
  },

  props: {
    process: {
      type: String,
      required: true
    },
    // What the process is, as its file says it: the head of its description.
    documentation: {
      type: String,
      default: null
    }
  },

  data() {
    return {
      lanes: [],
      nodes: [],
      highlighted: [],
      selection: [],
      // A tab remembered from before there were only two is the first one.
      tab: uiStateGet(this.app, 'ui.bpmn.process.tab', 'description') === 'paths' ? 'paths' : 'description'
    };
  },

  computed: {
    tabs() {
      return [
        { key: 'description', label: this.t('tab.description'), icon: 'ph:bold/info' },
        { key: 'paths', label: this.t('tab.paths'), icon: 'ph:bold/path' }
      ];
    },

    asideZone() {
      return ASIDE_ZONE;
    },

    picked() {
      return this.selection.length === 1
        ? this.nodes.find((node) => node.nodeId === this.selection[0]) ?? null
        : null;
    },

    pickedProperties() {
      const node = this.picked;

      if (!node) {
        return [];
      }

      const lane = this.lanes.find((candidate) => candidate.laneId === node.laneId);

      return [
        { key: this.t('step.name'), value: node.name || node.nodeId },
        { key: this.t('step.kind'), value: this.trans(`${ELEMENT}${node.element}`) },
        { key: this.t('step.lane'), value: lane ? (lane.name || lane.laneId) : '—' },
        ...(node.documentation ? [{ key: this.t('step.documentation'), value: node.documentation, full: true }] : [])
      ];
    }
  },

  // The width the reader left the inspector at, written once: from then on
  // the handle writes it, and a binding would put the first one back at every
  // redraw — a step walked.
  mounted() {
    const size = Number(uiStateGet(this.app, `ui.layout.zone.${ASIDE_ZONE}.size`, null));

    if (size > 0) {
      this.$refs.aside.style.setProperty('--zone-size', `${size}px`);
    }
  },

  methods: {
    t(key, parameters = {}) {
      return this.trans(`${T}${key}`, parameters);
    },

    onLoaded({ lanes, nodes }) {
      this.lanes = lanes;
      this.nodes = nodes;
    },

    onTab(key) {
      this.tab = key;
      uiStateSet(this.app, 'ui.bpmn.process.tab', key);
    }
  }
};
</script>
