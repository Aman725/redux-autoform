import React, { Component, PropTypes } from 'react'
import { reduxForm } from 'redux-form';
import MetadataEvaluator from './metadata/evaluator/MetadataEvaluator';
import ModelParser from './metadata/model/ModelParser';
// import UIManager from './UIManager';

class AutoFormInternal extends Component {
    static propTypes = {
        uiType: PropTypes.string,
        fields: PropTypes.object.isRequired,
        handleSubmit: PropTypes.func.isRequired,
        resetForm: PropTypes.func.isRequired,
        submitting: PropTypes.bool.isRequired,
        pristine: PropTypes.bool.isRequired,
        componentFactory: PropTypes.object,
        entity: PropTypes.object.isRequired,
        layout: PropTypes.object,
        buttonBar: PropTypes.func.isRequired,
        fieldLayout: PropTypes.string
    };

    //TODO JS: make this work
    getFactory() {
        const { uiType, componentFactory } = this.props;

        // if (!uiType) {
        //     return componentFactory;
        // }
        //
        // return UIManager.getFactoryPerType(uiType);
        return componentFactory;
    }

    buildGroupComponent = () => {
        //Fields: this is not the fields passed from AutoForm. This is generated by ReduxForm. 
        //This object has a property for each field. Each property contains all redux props for the given field
        let { fields, fieldMetadata, layout, values } = this.props;

        let modelProcessed = ModelParser.process(values, fieldMetadata);
        let fieldMetadataEvaluated = MetadataEvaluator.evaluate(fieldMetadata, modelProcessed, '', fields);
        let componentFactory = this.getFactory();

        return componentFactory.buildGroupComponent({
            component: layout.component,
            layout: layout,
            fields: fieldMetadataEvaluated,
            componentFactory: componentFactory
        });
    };

	getSubErrors = (fields) => {
		let arr = fields.map(field => {
			let result = null;

			for (let key in field) {
				if (field.hasOwnProperty(key)) {
					if (field[key].error) {
						result = {...result, ...{[field[key].name]: field[key].error}};
					}
				}
			}

			return result;
		});

		return arr.filter(field => {
			return (field !== null)? true : false;
		});
	};

	getErrors = (fields) => {
		let arr = [];

		for (let key in fields) {
			if (fields.hasOwnProperty(key)) {
				if (Array.isArray(fields[key])) {
					let subArr = this.getSubErrors(fields[key]);

					//Merge both arrays into one to get the values up to date
					arr = [...arr, ...subArr];
				}
				else if (fields[key].error) {
					arr.push({[fields[key].name]: fields[key].error});
				}
			}
		}

		return arr;
	};

	getButtonBar = () => {
		//Because redux-form always force a re-render with different kinds of events,
		//we got the errors up to date in fields object
		let { buttonBar, submitting, pristine, fields } = this.props;
		let errors = this.getErrors(fields);

		console.info("This is the array => " + JSON.stringify(errors, null, 2));

		let buttonBarProps = {
			submitting: submitting,
			pristine: pristine,
			errors: errors
		};

		return React.createElement(buttonBar, buttonBarProps);
	};

    render() {
        let groupComponent = this.buildGroupComponent();
        let componentFactory = this.getFactory();
	    let buttonBar = this.getButtonBar();
        let Root = componentFactory.getRoot();

        return (
            <Root {...this.props}>
                { groupComponent }
                { buttonBar }
            </Root>
        )
    }
}

export default reduxForm()(AutoFormInternal);