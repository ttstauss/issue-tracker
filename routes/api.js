/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
const mongoose = require('mongoose')
const moment = require('moment')

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

// connect to db
mongoose.connect(process.env.DB)

// set up mongoose schema & model
const Schema = mongoose.Schema

const projectSchema = new Schema({
  projectName: {
    type: String,
    required: true
  },
  issues: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Issue'
  }]
})

const issueSchema = new Schema({
  issue_title: {
    type: String,
    required: true
  },
  issue_text: {
    type: String,
    required: true
  },
  created_by: {
    type: String,
    required: true
  },
  assigned_to: {
    type: String
  },
  status_text: {
    type: String
  },
  created_on: {
    type: Date,
    default: Date.now
  },
  updated_on: {
    type: Date,
    default: Date.now
  },
  open: {
    type: Boolean,
    default: true
  }  
})

const Project = mongoose.model('Project', projectSchema)
const Issue = mongoose.model('Issue', issueSchema)

// set up db functions
const getProject = (projectName, done) => {
  Project.find({projectName}, (err, data) => {
    if(err) return done(err)
    return done(null, data)
  })
}

const createAndSaveProject = (projectName, issueId, done) => {
  const project = new Project({projectName})
  project.issues.push(issueId)
  project.save((err, data) => {
    if(err) return done(err)
    return done(null, data)
  })
}

const updateProject = (project, issueId, option, done) => {
  if (option === 'add'){
    project.issues.push(issueId)
  }
  if (option === 'remove') {
    const index = project.issues.findIndex(id => id === issueId)
    project.issues.splice(index, 1)
  }
  project.save((err, data) => {
    if(err) return done(err)
    return done(null, data)
  })
}

const createAndSaveIssue = ({issue_title, issue_text, created_by, assigned_to = '', status_text = ''}, done) => {
  const issue = new Issue({issue_title, issue_text, created_by, assigned_to, status_text})
  issue.save((err, data) => {
    if(err) return done(err)
    return done(null, data)
  })
}

const getIssues = (projectName, {_id, issue_title, issue_text, created_on, updated_on, created_by, assigned_to, open, status_text}, done) => {
  let query = { $and: []}
  if (_id) query._id = _id
  if (issue_title) {query.$and.push({issue_title})}
  if (issue_text) {query.$and.push({issue_text})}  
  if (created_on) {query.$and.push({ created_on: { '$gte': moment(created_on).startOf('day').toDate(), '$lte': moment(created_on).endOf('day').toDate() } })}
  if (updated_on) {query.$and.push({ created_on: { '$gte': moment(created_on).startOf('day').toDate(), '$lte': moment(created_on).endOf('day').toDate() } })}
  if (created_by) {query.$and.push({created_by})}
  if (assigned_to) {query.$and.push({assigned_to})}
  if (open) {query.$and.push({open})}
  if (status_text) {query.$and.push({status_text})}
  
  if (!query.$and.length) { query = {} }
  Project.find({projectName})
         .populate({
           path: 'issues',
           match: query
         })
         .exec((err, data) => {
           if(err) return done(err)
           return done(null, data)
         })
}

const updateIssue = (issueId, updates, done) => {
  Issue.findOneAndUpdate({_id: issueId}, updates, {}, (err, data) => {
    if(err) return done(err)
    return done(null, data)
  })
}

const deleteIssue = (issueId, done) => {
  Issue.findByIdAndDelete(issueId, {}, (err, data) => {
    if(err) return done(err)
    return done(null, data)
  })
}

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      var project = req.params.project;
      var query = req.query
      getIssues(project, query, (err, data) => {
        if (!data.length) {
          return res.json(data)
        }
        res.json(data[0].issues)
      })
    })
    
    .post(function (req, res){
      var project = req.params.project
      if (req.body.issue_title === '' &&
          req.body.issue_text === '' &&
          req.body.created_by === '' &&
          req.body.assigned_to === '' &&
          req.body.status_text === '') {
        return res.json('missing required fields')
      }
      createAndSaveIssue(req.body, (err, data) => {
        if (err) { return res.json('missing required field') }
        const issueId = data._id
        getProject(project, (err, data) => {
          if(!data.length) {
            createAndSaveProject(project, issueId, (err, data) => {
            })
          } else {
            updateProject(data[0], issueId, 'add', (err, data) => {})
          }
        })
        res.json(data)
      })
    })
    
    .put(function (req, res){
      const issueId = req.body._id
      const {issue_title, issue_text, created_by, assigned_to, status_text, open = true} = req.body
      const updates = {}
      if (issue_title !== '' && issue_title !== undefined) { updates.issue_title = issue_title }
      if (issue_text !== '' && issue_text !== undefined) { updates.issue_text = issue_text }
      if (created_by !== '' && created_by !== undefined) { updates.created_by = created_by }
      if (assigned_to !== '' && assigned_to !== undefined) { updates.assigned_to = assigned_to }
      if (status_text !== '' && status_text !== undefined) { updates.status_text = status_text }
      updates.open = open
      updates.updated_on = new Date()
      if (issue_title === '' &&
          issue_text === '' &&
          created_by === '' &&
          assigned_to === '' &&
          status_text === '' &&
          open === true) {
        res.json('no updated field sent')
      } else {
        updateIssue(issueId, updates, (err, data) => {
          if (err) return res.json(`could not update ${err.stringValue}`)
          res.json(`successfully updated ${data._id}`)
        })
      }
    })
    
    .delete(function (req, res){
      const project = req.params.project
      const issueId = req.body._id
      if (!issueId) { return res.json(`_id error`) }
      deleteIssue(issueId, (err, data) => {
        getProject(project, (err, data) => {
          updateProject(data[0], issueId, 'remove', (err, data) => {
            if(err) { return res.json(`could not delete ${issueId}`) }
            res.json(`success: deleted ${issueId}`)
          })
        })
      })      
    });
    
};
