<script>
import Message from '@wexample/symfony-design-system/components/message/message.vue';
import AbstractEntityManipulatorVueMixin from '@wexample/symfony-design-system/js/Vue/AbstractEntityManipulatorVueMixin';
import BpmnIssue from '@wexample/symfony-bpmn/Entity/BpmnIssue';

const T = 'WexampleSymfonyBpmnDsBundle.components.bpmn-issues.bpmn-issues::';

// What the validation of a process says, each issue a message of the design
// system, as it is written: what is drawn but not run is told here.
export default {
  template: '#vue-template-wexample-symfony-bpmn-ds-bundle-components-bpmn-issues-bpmn-issues',

  mixins: [AbstractEntityManipulatorVueMixin],

  components: {
    Message
  },

  props: {
    process: {
      type: String,
      required: true
    }
  },

  data() {
    return {
      issues: [],
      loading: true
    };
  },

  mounted() {
    this.load();
  },

  methods: {
    async load() {
      try {
        this.issues = await this.getEntityRepository(BpmnIssue).fetchList({ query: { process: this.process } });
      } finally {
        this.loading = false;
      }
    },

    t(key) {
      return this.trans(`${T}${key}`);
    },

    messageType(issue) {
      return issue.severity === 'error' ? 'error' : 'warning';
    },

    messageTitle(issue) {
      return issue.elementId ? `${issue.elementId} — ${issue.message}` : issue.message;
    }
  }
};
</script>
