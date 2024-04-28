import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormV2',
    'x-component': 'ShowFormData',
    'x-pattern': 'readPretty',
    properties: {
      test: {
        type: 'string',
        default: 'red',
        title: 'Test',
        'x-decorator': 'FormItem',
        'x-component': 'ColorSelect',
      },
    },
  },
});

export default App;
