<script>
import Message from '@wexample/symfony-design-system/components/message/message.vue';
import AbstractEntityCollectionVueMixin from '@wexample/symfony-design-system/js/Vue/AbstractEntityCollectionVueMixin';
import BpmnIssue from '@wexample/symfony-bpmn/Entity/BpmnIssue';

const T = 'WexampleSymfonyBpmnDsBundle.components.bpmn-issues.bpmn-issues::';

// What the validation of a process says, each issue a message of the design
// system, as it is written: what is drawn but not run is told here.
export default {
  template: '#vue-template-wexample-symfony-bpmn-ds-bundle-components-bpmn-issues-bpmn-issues',

  mixins: [AbstractEntityCollectionVueMixin],

  components: {
    Message
  },

  props: {
    process: {
      type: String,
      required: true
    }
  },

  methods: {
    t(key) {
      return this.trans(`${T}${key}`);
    },

    getEntityClass() {
      return BpmnIssue;
    },

    getEntitiesFetchParams() {
      return { query: { process: this.process } };
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
