<script>
import AbstractEntityTable from '@wexample/symfony-design-system/components/collection/table/abstract-entity-table/abstract-entity-table.vue';
import BpmnProcess from '@wexample/symfony-bpmn/Entity/BpmnProcess';

const T = 'WexampleSymfonyBpmnDsBundle.components.bpmn-process-table.bpmn-process-table::';

// The processes of the registry, each opening its sheet.
export default {
  extends: AbstractEntityTable,

  template: '#vue-template-wexample-symfony-bpmn-ds-bundle-components-bpmn-process-table-bpmn-process-table',

  data() {
    return {
      fill: true,
      defaultSort: { key: 'name', direction: 'asc' }
    };
  },

  methods: {
    getEntityClass() {
      return BpmnProcess;
    },

    getColumnsConfiguration() {
      const t = (key) => this.trans(`${T}${key}`);

      return [
        {
          key: 'name',
          label: t('column.name'),
          sortable: true,
          href: { route: 'bpmn_process', parameters: (row) => ({ process: row.processId }) }
        },
        { key: 'documentation', label: t('column.documentation'), cell: 'clamp', secondary: true },
        { key: 'laneCount', label: t('column.lanes'), align: 'right' },
        { key: 'nodeCount', label: t('column.nodes'), align: 'right', sortable: true },
        {
          key: 'valid',
          label: t('column.valid'),
          align: 'center',
          cell: 'status',
          sortable: true,
          format: (value, row) => (value
            ? { type: row.warningCount ? 'warning' : 'success', label: row.warningCount ? t('status.warnings') : t('status.valid') }
            : { type: 'error', label: t('status.invalid') })
        }
      ];
    }
  }
};
</script>
