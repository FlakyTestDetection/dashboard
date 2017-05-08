import React, {Component} from 'react';
import * as firebase from 'firebase';
import ReactFireMixin from 'reactfire'
import reactMixin from 'react-mixin'

import './App.css';

// import { Button } from 'react-bootstrap';
import {ListGroup, ListGroupItem, Panel, Button, Glyphicon, Label, Badge} from 'react-bootstrap';

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
	if((job.state === 'errored' || !job.tests) && filter.showErrors)
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
		if (job.state === 'errored' || !job.tests)
			return 'danger';
		else if (job.state === 'passed')
			return 'success';
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

							var nTests= -1;
							var nFlakes = 0;
							var nFailures = 0;
							if(job.tests)
							{
								nTests = 0;
								for(let k in job.tests)
								{
									if(job.tests[k].nMethods)
									 nTests += job.tests[k].nMethods;
								}
							}
							if(job.failures && job.failures.flaky)
								nFlakes = Object.keys(job.failures.flaky).length;
							nFailures = nFlakes;
							if(job.failures && job.failures.notflaky)
								nFailures = Object.keys(job.failures.notflaky).length;

							var testStr = [];
							if(nTests < 0)
								testStr.push(<Label bsStyle="danger" key="tests0">No tests collected!</Label>);
							else {
								testStr.push(<span key="tests0">Tests:&nbsp;</span>);
								if(nFlakes)
									testStr.push(<Badge key="tests1" bsClass="badge info">{nFlakes}</Badge>);
								if(nFailures)
									testStr.push(<Badge key="tests2" bsClass="badge danger">{nFailures}</Badge>);

								testStr.push(<Badge key="tests3" bsClass="badge success">{nTests}</Badge>);
							}
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

		if(!this.props.builds)
			return <h1>
				<Glyphicon  bsClass=" glyphicon glyphicon-refresh spinning"  glyph="refresh" /> <Label>Loading...</Label>
			</h1>

		else
			return(		<div>
			<Panel header="Key to test listing">
				<Badge bsClass="badge danger"># Tests failing</Badge>
				<Badge bsClass="badge info"># Tests failing but flaky</Badge>
				<Badge bsClass="badge success">Total # test methods</Badge>
			</Panel>
				<Panel header="Results by project">
					<ListGroup>{this.props.orgs.filter(k=>orgPassesFilter(k['repo'],this.props.builds,this.props.filter)).map(createOrg)}</ListGroup></Panel>
		</div>)
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
				<h2>Show only jobs that:</h2>
				<Button active={this.state.filter.showLatestOnly} bsStyle="primary" data-filter="showLatestOnly"
				        onClick={this.toggleFilter}>Most recent build per project</Button>
				<Button active={this.state.filter.showErrors} bsStyle="danger" data-filter="showErrors"
				        onClick={this.toggleFilter}>Job Errored</Button>
				<Button active={this.state.filter.showWarnings} bsStyle="warning" data-filter="showWarnings"
				        onClick={this.toggleFilter}>Job Warned</Button>
				<Button active={this.state.filter.showOK} bsStyle="success" data-filter="showOK" onClick={this.toggleFilter}>Job
					OK</Button>
				<Button active={this.state.filter.showInfo} bsStyle="info" data-filter="showInfo"
				        onClick={this.toggleFilter}>Job Unknown</Button>

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
