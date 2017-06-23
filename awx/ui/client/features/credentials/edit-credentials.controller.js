const DEFAULT_ORGANIZATION_PLACEHOLDER = 'SELECT AN ORGANIZATION';

function EditCredentialsController (models, $state, $scope) {
    let vm = this || {};

    let me = models.me;
    let credential = models.credential;
    let credentialType = models.credentialType;

    vm.tab = {
        details: {  
            _active: true,
            _go: 'credentials.edit',
            _params: { credential_id: credential.get('id') }
        },
        permissions:{
            _go: 'credentials.edit.permissions',
            _params: { credential_id: credential.get('id') }
        }
    };

    $scope.$watch('$state.current.name', (value) => {
        if (/credentials.edit($|\.organization$)/.test(value)) {
            vm.tab.details._active = true;
            vm.tab.permissions._active = false;
        } else {
            vm.tab.permissions._active = true;
            vm.tab.details._active = false;
        }
    });

    // Only exists for permissions compatibility
    $scope.credential_obj = credential.get();

    vm.panelTitle = credential.get('name');

    vm.form = credential.createFormSchema('put', {
        omit: ['user', 'team', 'inputs']
    });

    vm.form.organization._resource = 'organization';
    vm.form.organization._route = 'credentials.edit.organization';
    vm.form.organization._value = credential.get('summary_fields.organization.id');
    vm.form.organization._displayValue = credential.get('summary_fields.organization.name');

    vm.form.credential_type._data = credentialType.get('results');
    vm.form.credential_type._format = 'grouped-object';
    vm.form.credential_type._display = 'name';
    vm.form.credential_type._key = 'id';
    vm.form.credential_type._exp = 'type as type.name group by type.kind for type in state._data';
    vm.form.credential_type._value = credentialType.getById(credential.get('credential_type'));

    vm.form.inputs = {
        _get (type) {
            let inputs = credentialType.mergeInputProperties(type);
            
            if (type.id === credential.get('credential_type')) {
                inputs = credential.assignInputGroupValues(inputs);
            }

            return inputs;
        },
        _source: vm.form.credential_type,
        _reference: 'vm.form.inputs',
        _key: 'inputs'
    };

    vm.form.save = data => {
        data.user = me.getSelf().id;
        credential.clearTypeInputs();
                
        return credential.request('put', data);
    };

    vm.form.onSaveSuccess = res => {
        $state.go('credentials.edit', { credential_id: credential.get('id') }, { reload: true });
    };
}

EditCredentialsController.$inject = [
    'resolvedModels',
    '$state',
    '$scope'
];

export default EditCredentialsController;
