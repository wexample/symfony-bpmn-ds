<script>
import AbstractEntityTable from '@wexample/symfony-design-system/components/collection/table/abstract-entity-table/abstract-entity-table.vue';
import BpmnTaskRight from '@wexample/symfony-bpmn/Entity/BpmnTaskRight';

const T = 'WexampleSymfonyBpmnDsBundle.components.bpmn-rights-table.bpmn-rights-table::';

// Who may act at each task of a process: its lane, and the role or the grant
// the lane takes. The process is the table's filter (`filters: { process }`).
export default {
  extends: AbstractEntityTable,

  template: '#vue-template-wexample-symfony-bpmn-ds-bundle-components-bpmn-rights-table-bpmn-rights-table',

  data() {
    return {
      natural: true,
      pageLength: null,
      defaultSort: { key: 'laneName', direction: 'asc' }
    };
  },

  methods: {
    getEntityClass() {
      return BpmnTaskRight;
    },

    getColumnsConfiguration() {
      const t = (key, parameters = {}) => this.trans(`${T}${key}`, parameters);

      return [
        { key: 'name', label: t('column.task'), sortable: true },
        { key: 'laneName', label: t('column.lane'), sortable: true },
        {
          key: 'role',
          label: t('column.who'),
          format: (value, row) => {
            if (row.automatic) {
              return t('who.automatic');
            }

            if (row.grant) {
              return t('who.grant', { '%grant%': row.grant });
            }

            return value ? t('who.role', { '%role%': value }) : t('who.anyone');
          }
        },
        {
          key: 'interruptedBy',
          label: t('column.interrupted'),
          secondary: true,
          format: (value) => (value?.length ? value.join(', ') : '')
        }
      ];
    }
  }
};
</script>
