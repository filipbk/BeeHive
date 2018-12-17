import React, { Component } from 'react';
import './ApiaryList.css';
import { Form, Input, Button, notification, Modal, Table, Select } from 'antd';
import { withRouter } from 'react-router-dom';
import { addHive, getAllHiveTypes, getAllHives } from '../util/APIUtils';
import LoadingIndicator  from '../common/LoadingIndicator';
const FormItem = Form.Item;
const Option = Select.Option;

class Apiary extends Component {
	_isMounted = false;

	constructor(props) {
		super(props);
		const date = new Date();
		this.receivedElements = [];
		this.loadApiaryData = this.loadApiaryData.bind(this);

		this.state = {
			apiaryData: [],
			isLoading: false,
			date: date,
			oldDate: date,
			error: null
		};
	}

	render() {
		const columns = [{
			title: 'Name',
			dataIndex: 'name',
			key: 'name',
			render: (text, record) => (
				<a href={'/apiary/' + record.id}>{text}</a>
			)
		}, {
			title: 'Hive type',
			dataIndex: 'typeName',
			key: 'typeName',
		}, {
			title: 'Box number',
			dataIndex: 'boxNumber',
			key: 'boxNumber',
		}, {
			title: 'Queen',
			dataIndex: 'queenDTO',
			key: 'queenDTO',
			render : (text, record) => (
				<div>
				{record.queenDTO !== null ? (<span>Yes</span>) : (<span>No</span>)}
				</div>
			)
		}];

		const {isLoading} = this.state;

		if(isLoading || this.state.apiaryData.apiaryINFO === undefined) {
			return <LoadingIndicator />;
		}

		const WrappedAddHiveForm = Form.create()(AddHiveForm);
		return (
			<div className="apiary-list">
				<Button style={{float: 'right'}} type="primary" onClick={this.showModal}>New hive</Button>
				<h1>Hives in apiary <span className='apiary-name'>{this.state.apiaryData.apiaryINFO.name}</span>:</h1>
				<WrappedAddHiveForm
					wrappedComponentRef={this.saveFormRef}
					visible={this.state.visible}
					onCancel={this.handleCancel}
					onCreate={this.handleCreate}
					onTypeChange={this.handleTypeChange}
					onBoxNumChange={this.handleBoxNumChange}
					{...this.props}
				/>
				{
					!this.state.isLoading && this.state.apiaryData.hives.length === 0 ? (
						<div className="no-polls-found">
							<h2>You haven't got any hives in this apiary yet.</h2>
						</div>	
					) : null
				}
				{
					!this.state.isLoading && this.state.apiaryData.hives.length > 0 ? (
						<div>
							<Table rowKey={record => record.id} columns={columns} dataSource={this.state.apiaryData.hives} />
						</div>
					) : null
				}
				{
					this.state.isLoading ? 
					<LoadingIndicator /> : null
				}
			</div>
		)
	}

	state = {
		visible: false
	};

	showModal = () => {
		this.setState({ visible: true });
	}

	handleCancel = () => {
		this.setState({ visible: false });
	}

	handleTypeChange = (type) => {
		this.receivedElements.type = type;
	}

	handleBoxNumChange = (num) => {
		this.receivedElements.boxNum = num;
	}

	handleCreate = () => {
		const form = this.formRef.props.form;
		form.validateFields((err, values) => {
			if (err) {
				return;
			}

			const apiaryRequest = values;
			apiaryRequest.apiaryId = this.props.match.params.id;
			apiaryRequest.hiveTypeId = this.receivedElements.type;
			apiaryRequest.boxNumber = this.receivedElements.boxNum;
			form.resetFields();
			this.setState({ visible: false });
			addHive(apiaryRequest)
			.then(response => {
					notification.success({
						message: 'BeeHive App',
						description: apiaryRequest.name + " created successfully!"
					});
					this.setState({date: new Date()})
				}).catch(error => {
					if(error.status === 401) {
						notification.error({
							message: 'BeeHive App',
							description: 'Data is incorrect. Please try again!'
						});					
					} else {
						notification.error({
							message: 'BeeHive App',
							description: 'Sorry! Something went wrong. Please try again!'
					});											
				}
			});
		});
	}

	loadApiaryData() {
		let promise = getAllHives(this.props.match.params.id);

		if(!promise) {
			return;
		}

		this.setState({isLoading: true});

		promise
		.then(response => {
			if(this._isMounted) {
				this.setState({
					apiaryData: response,
					isLoading: false
				});
			}
		})
		.catch(error => {
			this.setState({error, isLoading: false});
		});
	}

	componentDidUpdate(nextProps) {
		if(this.props.isAuthenticated !== nextProps.isAuthenticated) {
			this.setState({
				apiaryData: [],
				isLoading: false
			});
			this.loadApiaryData();
		}

		if(this.state.date !== this.state.oldDate) {
			this.loadApiaryData();
			const date = this.state.date;
			this.setState({
				oldDate: date
			})
		}
	}

	componentDidMount() {
		this._isMounted = true;
		this.loadApiaryData();
	}

	componentWillUnmount() {
		this._isMounted = false;
	}

	saveFormRef = (formRef) => {
		this.formRef = formRef;
	}
}




class AddHiveForm extends Component {

	_isMounted = false;

	constructor(props) {
		super(props);
		const date = new Date();
		this.state = {
			hiveTypes: [],
			date: date,
			isLoading: false,
			oldDate: date
		}
	}

	render() {

		const {
			visible, onCancel, onCreate, form, onTypeChange, onBoxNumChange
		} = this.props;

		const boxNumber = [{id: 1, title: 1}, {id: 2, title: 2}, {id: 3, title: 3}];

		const boxNumberDrop = boxNumber.map((type =>
				<Option key={type.id} value={type.id}>{type.title}</Option>
		));

		const hiveTypeDrop = this.state.hiveTypes.map((type =>
				<Option key={type.id} value={type.id}>{type.value}</Option>
		));

		const { getFieldDecorator } = form;
		return (
		<Modal
			visible={visible}
			title="Create a new hive"
			okText="Create"
			onCancel={onCancel}
			onOk={onCreate}
		>
			<Form layout="vertical">
				<FormItem label="Hive name:">
				{getFieldDecorator('name', {
					rules: [{ required: true, message: 'This field is required.' }],
				})(
					<Input
						name="name"
						type="text"
						placeholder="Name" />					
				)}
				</FormItem>
				
				{
					!this.state.isLoading && this.state.hiveTypes.length > 0 ? (
					<FormItem label="Hive type:">
					{getFieldDecorator('hive_type_id', {
						rules: [{ required: true, message: 'This field is required.' }],
					})(
						<Select name='hive_type_id' placeholder='Hive type' onChange={onTypeChange}>
							{hiveTypeDrop}
						</Select>				
					)}
					</FormItem> ) : null
				}
				{
					this.state.isLoading ? 
					<LoadingIndicator /> : null
				}

				<FormItem label="Box number:">
				{getFieldDecorator('boxNumber', {
					rules: [{ required: true, message: 'This field is required.' }],
				})(
					<Select name='boxNumber' onChange={onBoxNumChange} placeholder='Box number' >
						{boxNumberDrop}
					</Select>					
				)}
				</FormItem>
			</Form>
		</Modal>
		);
	}

	loadHiveTypes() {
		let promise = getAllHiveTypes();

		if(!promise) {
			return;
		}

		this.setState({isLoading: true});

		promise
		.then(response => {
			if(this._isMounted) {
				this.setState({
					hiveTypes: response,
					isLoading: false
				});
			}
		})
		.catch(error => {
			this.setState({error, isLoading: false});
		});
	}

	componentDidUpdate(nextProps) {
		if(this.state.date !== this.state.oldDate) {
			this.loadHiveTypes();
			const date = this.state.date;
			this.setState({
				oldDate: date
			})
		}
	}

	componentDidMount() {
		this._isMounted = true;
		this.loadHiveTypes();
	}

	componentWillUnmount() {
		this._isMounted = false;
	}

}

export default withRouter(Apiary);