import React, {Component} from 'react';
import * as firebase from 'firebase';

import ReactFireMixin from 'reactfire'
import reactMixin from 'react-mixin'

import './App.css';

// import { Button } from 'react-bootstrap';
import {
	ListGroup,
	ListGroupItem,
	Panel,
	Button,
	Glyphicon,
	Label,
	Badge,
	ButtonGroup,
	DropdownButton,
	MenuItem,
	Radio,
	InputGroup,
	FormControl,
	Nav,
	NavItem
} from 'react-bootstrap';

// import Confirm from 'react-confirm-bootstrap';

var config = {
	apiKey: "AIzaSyBffCZyWfVU5CYnkJH9FGyXrI-U896D4zE",
	authDomain: "flakytests.firebaseapp.com",
	databaseURL: "https://flakytests.firebaseio.com",
	projectId: "flakytests",
	storageBucket: "flakytests.appspot.com",
	messagingSenderId: "629558471777"
};
firebase.initializeApp(config);


// Initialize the FirebaseUI Widget using Firebase.

var db = firebase.database();

function getNewestBuild(org, builds) {
	if (builds && builds[org]) {
		var m = 0;
		for (let b in builds[org]) {
			for (let k in builds[org][b])
				if (builds[org][b][k].build_date && builds[org][b][k].build_date > m)
					m = builds[org][b][k].build_date;
		}
		return m;
	}
	return 0;
}
function orgPassesFilter(org, builds, filter) {
	if (builds && builds[org]) {
		for (let b in builds[org]) {
			if (buildPassesFilter(builds[org][b], filter))
				return true;
		}
	}
	return false;
}
function buildPassesFilter(build, filter) {
	for (let k in build) {
		if (jobPassesFilter(build[k], filter))
			return true;
	}
	return false;
}

function jobPassesFilter(job, filter) {
	if (job.state === 'passed' && filter.showOK)
		return true;
	if ((job.state === 'errored' || !job.nTestMethods) && filter.showErrors)
		return true;
	if (job.state === 'failed' && filter.showWarnings)
		return true;
	if (filter.showInfo && (job.state === undefined || job.state === 'canceled')) {
		return true;
	}
	return false;
}

class BuildsList extends Component {
	getJobStyle(job) {
		if (job.state === 'errored' || !job.nTestMethods)
			return 'danger';
		else if (job.state === 'passed')
			return 'success';
		else if (job.state === 'failed')
			return 'warning';
		return 'info';
	}

	onHide(proj,build,job){
		var triageRef = db.ref("triage/FlakyTestDetection/"+proj);
		triageRef.once("value").then(function(val){
			let v = val.val();

			Object.keys(v).forEach(function(test){
				if(v[test].flaky)
					Object.keys(v[test].flaky).forEach(function(jid)
					{
						if(jid === job)
						{
							triageRef.child(test).child("flaky").child(jid).remove();
						}
					});
				if(v[test].notFlaky)
					Object.keys(v[test].notFlaky).forEach(function(jid)
					{
						if(jid === job)
						{
							triageRef.child(test).child("notFlaky").child(jid).remove();
						}
					});
			});
		});
	}

	render() {
		var _this = this;

		var builds = this.props.builds;
		if (!builds)
			return <span>Placeholder, no builds yet</span>;
		builds = builds[this.props.proj];
		if (!builds)
			return <span>Placeholder, no builds yet</span>;
		var buildsToShow = builds;

		if (_this.props.filter.showLatestOnly) {
			let bids = Object.keys(builds);
			if (bids.length > 1) {
				buildsToShow = {};
				buildsToShow[bids[bids.length - 1]] = builds[bids[bids.length - 1]];
			}
		}
		var createBuild = function (item, bid) {
			// console.log(item);
			return <ListGroupItem key={bid}>
				<ListGroup> Build <a target="_new"
				                     href={"https://travis-ci.org/FlakyTestDetection/" + _this.props.proj + "/builds/" + bid}>{bid}</a>

					{Object.keys(item).filter(b => jobPassesFilter(item[b], _this.props.filter)).map(function (jobId) {
						var job = item[jobId];

						var nTests = -1;
						var nFlakes = 0;
						var nFailures = 0;
						if (job.nTestMethods)
							nTests = job.nTestMethods;
						if (job.nFlakies)
							nFlakes = job.nFlakies;
						nFailures = nFlakes;
						if (job.nFailuresNotFlaky)
							nFailures = job.nFailuresNotFlaky;
						var testStr = [];
						if (nTests < 0)
							testStr.push(<Label bsStyle="danger" key="tests0">No tests collected!</Label>);
						else {
							testStr.push(<span key="tests0">Tests:&nbsp;</span>);
							if (nFlakes)
								testStr.push(<Badge key="tests1" bsClass="badge info">{nFlakes}</Badge>);
							if (nFailures)
								testStr.push(<Badge key="tests2" bsClass="badge danger">{nFailures}</Badge>);

							testStr.push(<Badge key="tests3" bsClass="badge success">{nTests}</Badge>);
						}
						/*if(nFlakes > 10 || nFailures > 10)*/
						/*testStr.push(<Confirm key="conf" onConfirm={_this.onHide.bind(_this,_this.props.proj,bid,jobId)} body="Are you sure you want to mark this build as a tool error?" confirmTest="Confirm Hide" title="Confirm Hide"><Button>Mark as diffcov-error'ed build</Button></Confirm>);*/
						return <ListGroupItem bsStyle={_this.getJobStyle(job)} key={jobId}><span>Job:
							<a target="_new"
							   href={"https://travis-ci.org/FlakyTestDetection/" + _this.props.proj + "/jobs/" + jobId}>{job.number}</a>,
							building <a target="_new"
							            href={"https://github.com/FlakyTestDetection/" + _this.props.proj + "/commit/" + job.commit}>{(job.commit ? job.commit.substr(job.commit.length - 7) : "????")}</a>
									<span>&nbsp;{testStr}</span>
						</span></ListGroupItem>;
					})
					}
				</ListGroup>
			</ListGroupItem>
		};
		return <span>
<ListGroup>
	{Object.keys(buildsToShow).map(function (bid) {
		if (buildPassesFilter(buildsToShow[bid], _this.props.filter))
			return createBuild(buildsToShow[bid], bid)
		return null;
	})
	}

	{/*{buildsToShow.filter(k=>buildPassesFilter(k,this.props.filter)).map(createBuild)}*/}
</ListGroup>
</span>
	}
}

// function sanitizeKey(test)
// {
// 	return test.replace(/\./g,'-').replace(/\//g,'-').replace(/\[/,'-').replace(/\]/g,'-').replace(/#/g,'-').replace(/\$/g,'-');
// }

class TestTriage extends Component{
	constructor(props) {
		super(props);
		this.toggleTriage = this.toggleTriage.bind(this);
		this.updateNote = this.updateNote.bind(this);
		this.createNote = this.createNote.bind(this);

	}

	updateNote(e){
		var ref = db.ref("triage/FlakyTestDetection/"+this.props.proj+"/"+e.target.getAttribute("data-test")+"/note");
		ref.set(e.target.value);

	}

	createNote(e){
		this.triageRef.child("note").set("");

	}
	toggleTriage(e) {
		var ref = db.ref("triage/FlakyTestDetection/"+this.props.proj+"/"+e.target.getAttribute("data-test")+"/state");
		ref.set(e.target.getAttribute("data-changeto"));

		// var curFilter = this.state.filter;
		// curFilter[e.currentTarget.getAttribute("data-filter")] = !curFilter[e.currentTarget.getAttribute("data-filter")];
		// this.setState(curFilter);
	}


	render(){
		var _this = this;
		var test = this.props.test;
		var testData = this.props.testData;
		var triageKey = test;
		var triageState = this.props.testData.state;
		if(!triageState)
			triageState = "unconfirmed";
		let nFlakes = 0;
		if(testData.flaky)
			nFlakes = Object.keys(testData.flaky).length;
		let nFails = 0;
		if(testData.notFlaky)
			nFails = Object.keys(testData.notFlaky).length;
		if(nFails === 0 && nFlakes === 0)
			return null;
		return <ListGroupItem key={test} bsClass={"list-group-item " + triageState}><h4>{test}</h4> Flaked: {nFlakes + (nFlakes > 0 ? ": ": "")}
			<span>
			{(testData.flaky? Object.keys(testData.flaky).map(function (jobid) {
					return <span key={jobid}><a target="_new"
					                            href={"https://travis-ci.org/FlakyTestDetection/" + _this.props.proj + "/jobs/" + jobid}>{testData.flaky[jobid]}</a>&nbsp;</span>;
				}
			) : "")}
		</span>
			Other failures: {nFails}
			<span>
			{(testData.notFlaky ? Object.keys(testData.notFlaky).map(function (jobid) {
					return <span key={jobid}><a target="_new"
					                            href={"https://travis-ci.org/FlakyTestDetection/" + _this.props.proj + "/jobs/" + jobid}>{testData.notFlaky[jobid]}</a>&nbsp;</span>;
				}
			) :"")}
		</span>
			<div>
				Triage status:
				<form>
					<InputGroup>
						<Radio name="triageState" onChange={_this.toggleTriage} checked={triageState === "unconfirmed"} data-test={triageKey} data-changeto="unconfirmed">Unconfirmed</Radio>
						<Radio name="triageState" onChange={_this.toggleTriage} checked={triageState === "confirmed-flake"}  data-test={triageKey} data-changeto="confirmed-flake">Confirmed Flake</Radio>
						<Radio name="triageState" onChange={_this.toggleTriage} checked={triageState === "confirmed-notflake"} data-test={triageKey} data-changeto="confirmed-notflake">Confirmed Not-flake</Radio>
						<Radio name="triageState" onChange={_this.toggleTriage} checked={triageState === "tool-error"} data-test={triageKey} data-changeto="tool-error">Tool error</Radio>

					</InputGroup>
						<FormControl type="text" label="Notes" onChange={_this.updateNote}
						             value={testData.note} data-test={triageKey}/>
				</form>
			</div>
		</ListGroupItem>;
	}
}

class TestsList extends Component {

	testPassesFilter(test,filter) {
		if(test.state)
		{
			if(test.state === 'confirmed-flake' && filter.showFlakes)
				return true;
			if(test.state === 'confirmed-notflake' && filter.showNonFlakes)
				return true;
			if(test.state === 'unconfirmed' && filter.showUnknown)
				return true;
			if(test.state === 'tool-error' && filter.showToolError)
				return true;
		}
		else if(filter.showUnknown)
			return true;

		return false;
	}
	testListPassesFilter(testList,filter){
		var _this = this;
		var ok = false;
		Object.keys(testList).map(function (test) {
			if(test !== '.key' && test !== '.value' && _this.testPassesFilter(testList[test],filter))
					ok = true;
			return null;
		});

		return ok;
	}
	render() {

		var _this = this;

		if (!this.state || !this.state.triage)
			return null;

		if(!this.testListPassesFilter(this.state.triage,this.props.filter))
			return null;

		return <ListGroupItem>
			<h4>{_this.props.proj}</h4>
		<ListGroup>{
			Object.keys(this.state.triage).map(function (test) {
				if(test !== '.key' && test !== '.value' && _this.testPassesFilter(_this.state.triage[test],_this.props.filter))
				return <TestTriage key={test} test={test} proj={_this.props.proj} testData={_this.state.triage[test]} />
				else return null;
			})
		}
		</ListGroup></ListGroupItem>;
	}
	componentWillMount(){
		this.triageRef = db.ref("triage/FlakyTestDetection/"+this.props.proj);
		this.bindAsObject(this.triageRef, 'triage');
	}
}
class GHOrg extends Component {

	render() {
		// var createProject = function (item, index) {
		// 	return <li key={item}>/{item}
		// 		Builds: <BuildsList proj={item}/>
		// 	</li>
		// }

		var _this = this;

		var createOrg = function (item, index) {
			if (_this.props.view === 'byTest') {

				return	<TestsList proj={item['repo']} filter={_this.props.filter} key={item['.key']} />
			}
			else
				return <ListGroupItem key={item['.key']}>
					<span><a href={item['url']} target="_new">{item['org']}/{item['repo']}</a></span>
					<BuildsList proj={item['repo']} filter={_this.props.filter} builds={_this.props.builds}/>
				</ListGroupItem>
		};

		if(this.props.view==='byTest')
		{
			return <ListGroup>{this.props.orgs.map(createOrg)}</ListGroup>
		}
		else if (!this.props.builds)
			return <h1>
				<Glyphicon bsClass=" glyphicon glyphicon-refresh spinning" glyph="refresh"/> <Label>Loading...</Label>
			</h1>
		else
			return (        <div>
				<Panel header="Key to test listing">
					<Badge bsClass="badge danger"># Tests failing</Badge>
					<Badge bsClass="badge info"># Tests failing but flaky</Badge>
					<Badge bsClass="badge success">Total # test methods</Badge>
				</Panel>
				<Panel header="Results by project">
					<ListGroup>{this.props.orgs.sort(function (a, b) {
						if (_this.props.filter.sort === 'newest') {
							var i = getNewestBuild(a.repo, _this.props.builds);
							var j = getNewestBuild(b.repo, _this.props.builds);
							if (i < j)
								return 1;
							else if (i > j)
								return -1;
							return 0;
						}
						else {
							if (a.org > b.org)
								return 1;
							else if (a.org < b.org)
								return -1;
							return 0;
						}
					}).filter(k => orgPassesFilter(k['repo'], this.props.builds, this.props.filter)).map(createOrg)}</ListGroup></Panel>
			</div>)
	};
}

class ProjectList extends Component {

	constructor(props) {
		super(props);
		this.toggleFilter = this.toggleFilter.bind(this);
		this.toggleSort = this.toggleSort.bind(this);

	}

	toggleFilter(e) {
		var curFilter = this.state.filter;
		curFilter[e.currentTarget.getAttribute("data-filter")] = !curFilter[e.currentTarget.getAttribute("data-filter")];
		this.setState(curFilter);
	};

	toggleSort(e) {
		var curFilter = this.state.filter;
		curFilter['sort'] = e;
		this.setState(curFilter);
	};

	render() {
		return (
			<div><Panel header="Filter Settings">
				<h2>Show only jobs that:</h2>
				<ButtonGroup>
					<Button active={this.state.filter.showLatestOnly} bsStyle="primary" data-filter="showLatestOnly"
					        onClick={this.toggleFilter}>Most recent build per project</Button>
					<Button active={this.state.filter.showErrors} bsStyle="danger" data-filter="showErrors"
					        onClick={this.toggleFilter}>Job Errored</Button>
					<Button active={this.state.filter.showWarnings} bsStyle="warning" data-filter="showWarnings"
					        onClick={this.toggleFilter}>Job Warned</Button>
					<Button active={this.state.filter.showOK} bsStyle="success" data-filter="showOK"
					        onClick={this.toggleFilter}>Job
						OK</Button>
					<Button active={this.state.filter.showInfo} bsStyle="info" data-filter="showInfo"
					        onClick={this.toggleFilter}>Job Unknown</Button>
				</ButtonGroup>
				{/*<h2>Sorting:</h2>*/} &nbsp;
				<DropdownButton id="sort-dropdown" title="Sort-by" onSelect={this.toggleSort}>
					<MenuItem eventKey="alpha" active={this.state.filter.sort === 'alpha'}>Alphabetical</MenuItem>
					<MenuItem eventKey="newest" active={this.state.filter.sort === 'newest'}>Newest First</MenuItem>
				</DropdownButton>
			</Panel>
				<GHOrg orgs={this.state.orgs} filter={this.state.filter} builds={this.state.builds}
				        view="byJob"/>
			</div>);
	};

	componentWillMount() {
		var buildRef = db.ref("MirroredRepos");
		this.bindAsArray(buildRef, 'orgs');
		this.bindAsObject(db.ref("summary/FlakyTestDetection/"), "builds");
		this.setState(prevState => ({
			filter: {
				showLatestOnly: true,
				showErrors: true,
				showWarnings: true,
				showInfo: false,
				showOK: true,
				sort: 'newest'
			}
		}));
	};


}

class ProjectTestsList extends Component {

	constructor(props) {
		super(props);
		this.toggleFilter = this.toggleFilter.bind(this);

	}

	toggleFilter(e) {
		var curFilter = this.state.filter;
		curFilter[e.currentTarget.getAttribute("data-filter")] = !curFilter[e.currentTarget.getAttribute("data-filter")];
		this.setState(curFilter);
	};

	render() {
		return (
			<div>
				<Panel header="Filter settings">
				<h2>Show only tests that:</h2>
				<ButtonGroup>
					<Button active={this.state.filter.showNonFlakes} bsStyle="danger" data-filter="showNonFlakes"
					        onClick={this.toggleFilter}>Triaged, Failed</Button>
					<Button active={this.state.filter.showFlakes} bsStyle="success" data-filter="showFlakes"
					        onClick={this.toggleFilter}>Triaged, Flaked</Button>
					<Button active={this.state.filter.showUnknown} bsStyle="info" data-filter="showUnknown"
					        onClick={this.toggleFilter}>Not Triaged</Button>
					<Button active={this.state.filter.showToolError} bsStyle="warning" data-filter="showToolError"
					        onClick={this.toggleFilter}>Tool error</Button>

				</ButtonGroup>

			</Panel>
				<GHOrg orgs={this.state.orgs} filter={this.state.filter} builds={this.state.builds} view="byTest"/>
			</div>);
	};

	componentWillMount() {
		var buildRef = db.ref("MirroredRepos");
		this.bindAsArray(buildRef, 'orgs');

		// this.bindAsObject(db.ref("triage/FlakyTestDetection/"), "triage");
		this.setState(prevState => ({
			filter: {
				showLatestOnly: true,
				showErrors: true,
				showWarnings: true,
				showInfo: false,
				showOK: true,
				sort: 'newest',
				showUnknown : true,
				showFlakes: true,
				showToolError: false,
				showNonFlakes: true
			}
		}));
	};
}
reactMixin(ProjectList.prototype, ReactFireMixin)
reactMixin(BuildsList.prototype, ReactFireMixin)
reactMixin(ProjectTestsList.prototype, ReactFireMixin)
reactMixin(TestsList.prototype, ReactFireMixin)


class App extends Component {

	constructor(props) {
		super(props);
		this.changeNav = this.changeNav.bind(this);
	}


	componentWillMount(){
		var _this = this;
		this.setState({activeNav: 1});
		firebase.auth().onAuthStateChanged(function(user) {
			_this.setState({user: user});
			if (user) {
			} else {

				// User is signed out.
				var provider = new firebase.auth.GithubAuthProvider();
				firebase.auth().signInWithRedirect(provider);
			}
		}, function(error) {
			console.log(error);
		});

	}
	download(content, fileName, mimeType) {
		var a = document.createElement('a');
		mimeType = mimeType || 'application/octet-stream';

		if (navigator.msSaveBlob) { // IE10
			navigator.msSaveBlob(new Blob([content], {
				type: mimeType
			}), fileName);
		} else if (URL && 'download' in a) { //html5 A[download]
			a.href = URL.createObjectURL(new Blob([content], {
				type: mimeType
			}));
			a.setAttribute('download', fileName);
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		} else {
			location.href = 'data:application/octet-stream,' + encodeURIComponent(content); // only this mime type is supported
		}
	}
	changeNav(e){
		if(e === 3)
		{
			var _this = this;
			db.ref("triage/FlakyTestDetection").once("value").then(function(v){
				let csv = "project,testName,numberOfLikelyFlakes,numberOfFailures,state\n";
				Object.keys(v.val()).forEach(function(proj){
					Object.keys(v.val()[proj]).forEach(function(test){
						let d = v.val()[proj][test];
						if(d.state && d.state === 'tool-error')
							return;
						csv +=proj+","+test+",";
						let nFlake = 0;
						let nFail = 0;
						if (d.flaky)
							nFlake = Object.keys(d.flaky).length;
						if (d.notflaky)
							nFail = Object.keys(d.notflaky).length;
						csv += nFlake + "," + nFail+","+d.state+"\n";
						csv+="\n";
					});
				});
				console.log("OK,got csv");
				// console.log(csv);
				_this.download(csv,"flakyCoverageExport.csv","text/csv;encoding:utf-8");
			}).catch(function(er){
				console.log(er);
			});

		}
		else
			this.setState({activeNav: e});
	}
	render() {
		return (
			<div className="App">
				<div className="App-header">
					<h2>FlakyTests Dashboard</h2>
				</div>
				<Nav bsStyle="tabs" activeKey={this.state.activeNav} onSelect={this.changeNav}>
					<NavItem eventKey={1}>View grouped by tests</NavItem>
					<NavItem eventKey={2}>View grouped by builds</NavItem>
					<NavItem eventKey={3}>Export to CSV</NavItem>
				</Nav>
				{(this.state.activeNav === 1 ?
						<ProjectTestsList /> :
				<ProjectList />)
				}

			</div>
		);
	}
}

export default App;
