import React, {Component} from 'react';
import * as firebase from 'firebase';
import ReactFireMixin from 'reactfire'
import reactMixin from 'react-mixin'

import './App.css';

// import { Button } from 'react-bootstrap';
import {ListGroup, ListGroupItem, Panel, Button, Glyphicon} from 'react-bootstrap';

var config = {
	apiKey: "AIzaSyBffCZyWfVU5CYnkJH9FGyXrI-U896D4zE",
	authDomain: "flakytests.firebaseapp.com",
	databaseURL: "https://flakytests.firebaseio.com",
	projectId: "flakytests",
	storageBucket: "flakytests.appspot.com",
	messagingSenderId: "629558471777"
};
firebase.initializeApp(config);

var db = firebase.database();

function orgPassesFilter(org, builds, filter)
{
	if(builds && builds[org])
	{
		for(let b in builds[org])
		{
			if(buildPassesFilter(builds[org][b],filter))
				return true;
		}
	}
	return false;
}
function buildPassesFilter(build, filter)
{
	for(let k in build)
	{
		if(jobPassesFilter(build[k], filter))
			return true;
	}
	return false;
}

function jobPassesFilter(job, filter)
{
	if(job.state === 'passed' && filter.showOK)
		return true;
	if(job.state === 'errored' && filter.showErrors)
		return true;
	if(job.state === 'failed' && filter.showWarnings)
		return true;
	if(filter.showInfo && (job.state === undefined || job.state === 'canceled'))
	{
		return true;
	}
	return false;
}

class BuildsList extends Component {
	getJobStyle(job) {
		if (job.state === 'passed')
			return 'success';
		else if (job.state === 'errored')
			return 'danger';
		else if (job.state === 'failed')
			return 'warning';
		return 'info';
	}

	render() {
		var _this = this;

		var builds = this.props.builds;
		if(!builds)
			return <span>Placeholder, no builds yet</span>;
		builds = builds[this.props.proj];
		if(!builds)
			return <span>Placeholder, no builds yet</span>;
		var buildsToShow = builds;

		if (_this.props.filter.showLatestOnly) {
			let bids = Object.keys(builds);
			if (bids.length > 1) {
				buildsToShow = {};
				buildsToShow[bids[bids.length-1]] = builds[bids[bids.length - 1]];
			}
		}
		var createBuild = function (item, bid) {
			// console.log(item);
			return <ListGroupItem key={bid}>
				<ListGroup> Build <a target="_new"
				                     href={"https://travis-ci.org/FlakyTestDetection/" + _this.props.proj + "/builds/" + bid}>{bid}</a>

					{Object.keys(item).filter(b => jobPassesFilter(item[b],_this.props.filter)).map(function (jobId) {
							var job = item[jobId];
							return <ListGroupItem bsStyle={_this.getJobStyle(job)} key={jobId}><span>Job:
							<a target="_new"
							   href={"https://travis-ci.org/FlakyTestDetection/" + _this.props.proj + "/jobs/" + jobId}>{job.number}</a>,
							building <a target="_new"
							            href={"https://github.com/FlakyTestDetection/" + _this.props.proj + "/commit/" + job.commit}>{(job.commit ? job.commit.substr(job.commit.length - 7) : "????")}</a>

								{/*<span style={{display: 'none'}}>Tests: <ul>*/}
								{/*{*/}
								{/*(job.tests == null ? "" : Object.keys(job.tests).filter(v => v !== '.key').map(function (testName) {*/}
								{/*return <li key={testName}>*/}
								{/*{testName}*/}
								{/*</li>*/}
								{/*}))*/}
								{/*}		</ul>*/}
								{/*</span>*/}
						</span></ListGroupItem>;
						})
					}
				</ListGroup>
			</ListGroupItem>
		};
		return <span>
<ListGroup>
	{Object.keys(buildsToShow).map(function(bid){
		if(buildPassesFilter(buildsToShow[bid], _this.props.filter))
			return createBuild(buildsToShow[bid],bid)
		return null;
	})
	}

	{/*{buildsToShow.filter(k=>buildPassesFilter(k,this.props.filter)).map(createBuild)}*/}
</ListGroup>
</span>
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
			return <ListGroupItem key={item['.key']}>
				<span><a href={item['url']} target="_new">{item['org']}/{item['repo']}</a></span>
				<BuildsList proj={item['repo']} filter={_this.props.filter} builds={_this.props.builds} />
			</ListGroupItem>
		};
		/*
		 <button class="btn btn-lg btn-warning">
		 <span class="glyphicon glyphicon-refresh spinning"></span> Loading...
		 </button>
		 */
		if(!this.props.builds)
			return <Panel bsSize="large">
				<Glyphicon  bsClass=" glyphicon glyphicon-refresh spinning"  glyph="refresh" /> Loading...
			</Panel>

		else
			return <ListGroup>{this.props.orgs.filter(k=>orgPassesFilter(k['repo'],this.props.builds,this.props.filter)).map(createOrg)}</ListGroup>
	};
}

class ProjectList extends Component {

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
			<div><Panel header="Filter settings">
				<Button active={this.state.filter.showLatestOnly} bsStyle="primary" data-filter="showLatestOnly"
				        onClick={this.toggleFilter}>Only show newest build</Button>
				<Button active={this.state.filter.showErrors} bsStyle="danger" data-filter="showErrors"
				        onClick={this.toggleFilter}>Show Errors</Button>
				<Button active={this.state.filter.showWarnings} bsStyle="warning" data-filter="showWarnings"
				        onClick={this.toggleFilter}>Show Warnings</Button>
				<Button active={this.state.filter.showOK} bsStyle="success" data-filter="showOK" onClick={this.toggleFilter}>Show
					OK</Button>
				<Button active={this.state.filter.showInfo} bsStyle="info" data-filter="showInfo"
				        onClick={this.toggleFilter}>Show Unknown</Button>

			</Panel>
				<GHOrg orgs={this.state.orgs} filter={this.state.filter} builds={this.state.builds} />
			</div>);
	};

	componentWillMount() {
		var buildRef = db.ref("MirroredRepos");
		this.bindAsArray(buildRef, 'orgs');
		this.bindAsObject(db.ref("builds/FlakyTestDetection/"), "builds");
		this.setState(prevState => ({
			filter:{
				showLatestOnly: true,
				showErrors: true,
				showWarnings: true,
				showInfo: false,
				showOK: true
			}
		}));
	};


}

reactMixin(ProjectList.prototype, ReactFireMixin)
reactMixin(BuildsList.prototype, ReactFireMixin)


class App extends Component {

	render() {
		return (
			<div className="App">
				<div className="App-header">
					<h2>FlakyTests Dashboard</h2>
				</div>
				<ProjectList />
			</div>
		);
	}
}

export default App;
