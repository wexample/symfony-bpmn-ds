<script>
import Tab from '@wexample/symfony-design-system/components/tab/tab.vue';
import Timeline from '@wexample/symfony-design-system/components/timeline/timeline.vue';
import AbstractEntityManipulatorVueMixin from '@wexample/symfony-design-system/js/Vue/AbstractEntityManipulatorVueMixin';
import BpmnPath from '@wexample/symfony-bpmn/Entity/BpmnPath';
import { bpmnElementIcon } from '../../js/Helper/BpmnElementHelper';

const T = 'WexampleSymfonyBpmnDsBundle.components.bpmn-path-walk.bpmn-path-walk::';

// The paths of a process, one walked step by step: each step on the timeline
// of the design system, who acts at it, which way a choice went. What is
// walked so far is handed back by its BPMN ids (`update:highlighted`), for a
// diagram beside it to light.
//
// `lanes` names the actors: the lanes the diagram read, given here rather
// than read a second time.
export default {
  template: '#vue-template-wexample-symfony-bpmn-ds-bundle-components-bpmn-path-walk-bpmn-path-walk',

  mixins: [AbstractEntityManipulatorVueMixin],

  components: {
    Tab,
    Timeline
  },

  emits: ['update:highlighted'],

  props: {
    process: {
      type: String,
      required: true
    },
    lanes: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      paths: [],
      // The path walked, by its position — the first once read —, and how
      // far: null while there is none.
      current: null,
      step: 0,
      loading: true
    };
  },

  computed: {
    // A path that comes back on itself is told by its icon.
    pathTabs() {
      return this.paths.map((path, position) => ({
        key: String(position),
        label: this.pathTitle(path),
        icon: path.complete ? 'ph:bold/flag-checkered' : 'ph:bold/arrows-clockwise'
      }));
    },

    path() {
      return this.current === null ? null : this.paths[this.current] ?? null;
    },

    laneNames() {
      return Object.fromEntries(this.lanes.map((lane) => [lane.laneId, lane.name || lane.laneId]));
    },

    // A choice is told on the step it was made at: the way out it took.
    choices() {
      return Object.fromEntries((this.path?.choices ?? []).map((choice) => [choice.nodeId, choice.label]));
    },

    items() {
      return (this.path?.steps ?? []).map((step, index) => ({
        title: step.name || step.nodeId,
        meta: this.laneNames[step.laneId] ?? null,
        text: this.choices[step.nodeId] ? this.t('chose', { '%choice%': this.choices[step.nodeId] }) : null,
        icon: bpmnElementIcon(step.element),
        state: index < this.step ? 'done' : (index === this.step ? 'current' : null)
      }));
    },

    // The steps walked so far and the flows taken to them.
    highlighted() {
      const steps = (this.path?.steps ?? []).slice(0, this.step + 1);

      return steps.flatMap((step) => (step.flowId ? [step.flowId, step.nodeId] : [step.nodeId]));
    },

    isFirst() {
      return this.step <= 0;
    },

    isLast() {
      return !this.path || this.step >= this.path.steps.length - 1;
    }
  },

  watch: {
    highlighted(value) {
      this.$emit('update:highlighted', value);
    },

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
      this.loading = true;

      try {
        this.paths = await this.getEntityRepository(BpmnPath).fetchList({ query: { process: this.process } });
        this.current = this.paths.length ? 0 : null;
        this.step = 0;
      } finally {
        this.loading = false;
      }
    },

    pick(position) {
      this.current = position;
      this.step = 0;
    },

    previous() {
      this.step = Math.max(0, this.step - 1);
    },

    next() {
      if (!this.isLast) {
        this.step += 1;
      }
    },

    // The whole path at once: every step walked.
    all() {
      this.step = this.path.steps.length - 1;
    },

    pathTitle(path) {
      return this.t('path', { '%number%': path.position + 1 });
    }
  }
};
</script>
