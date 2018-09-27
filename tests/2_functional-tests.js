/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  
    suite('POST /api/issues/{project} => object with issue data', function() {
      
      test('Every field filled in', function(done) {
       chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Title',
          issue_text: 'text',
          created_by: 'Functional Test - Every field filled in',
          assigned_to: 'Chai and Mocha',
          status_text: 'In QA'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isObject(res.body)
          assert.equal(res.body.issue_title, 'Title')
          assert.equal(res.body.issue_text, 'text')
          assert.equal(res.body.created_by, 'Functional Test - Every field filled in')
          assert.equal(res.body.assigned_to, 'Chai and Mocha')
          assert.equal(res.body.status_text, 'In QA')
          done();
        });
      });
      
      test('Required fields filled in', function(done) {
        chai.request(server)
            .post('/api/issues/test/')
            .send({
              issue_title: 'Title',
              issue_text: 'text',
              created_by: 'Functional Test - Every field filled in'
            })
            .end(function(err, res){
              assert.equal(res.status, 200);
              assert.isObject(res.body)
              assert.equal(res.body.issue_title, 'Title')
              assert.equal(res.body.issue_text, 'text')
              assert.equal(res.body.created_by, 'Functional Test - Every field filled in')
              assert.equal(res.body.assigned_to, '')
              assert.equal(res.body.status_text, '')
              done();
            });
      });
      
      test('Missing required fields', function(done) {
        chai.request(server)
            .post('/api/issues/test/')
            .send({
              issue_text: 'text',
              created_by: 'Functional Test - Missing required fields'
            })
            .end(function(err, res) {
              console.log(res.body)
              assert.equal(res.status, 200)
              assert.equal(res.body, 'missing required field')
              done()
            })
      })
      
    });
    
    suite('PUT /api/issues/{project} => text', function() {
      
      test('No body', function(done) {
        chai.request(server)
            .get('/api/issues/test')
            .end(function(err, res) {
              chai.request(server)
                  .put('/api/issues/test')
                  .send({
                    _id: res.body[0]._id,
                    issue_title: '',
                    issue_text: '',
                    created_by: '',
                    assigned_to: '',
                    status_text: '',
                    open: true
                  })
                  .end(function(err, res) {
                    assert.equal(res.status, 200)
                    assert.equal(res.body, 'no updated field sent')
                    done()
                  })
            })
      });
      
      test('One field to update', function(done) {
        chai.request(server)
            .get('/api/issues/test')
            .end(function(err, res) {
              const issueId = res.body[0]._id
              chai.request(server)
                  .put('/api/issues/test')
                  .send({
                    _id: issueId,
                    issue_title: 'new title',
                    issue_text: '',
                    created_by: '',
                    assigned_to: '',
                    status_text: '',
                    open: true
                  })
                  .end(function(err, res) {
                    assert.equal(res.status, 200)
                    assert.equal(res.body, `successfully updated ${issueId}`)
                    done()
                  })
            })
      });
      
      test('Multiple fields to update', function(done) {
        chai.request(server)
            .get('/api/issues/test')
            .end(function(err, res) {
              const issueId = res.body[0]._id
              chai.request(server)
                  .put('/api/issues/test')
                  .send({
                    _id: issueId,
                    issue_title: 'new title',
                    issue_text: 'new text',
                    created_by: 'dude man',
                    assigned_to: 'the dude',
                    status_text: '',
                    open: true
                  })
                  .end(function(err, res) {
                    assert.equal(res.status, 200)
                    assert.equal(res.body, `successfully updated ${issueId}`)
                    done()
                  })
            })
      });
      
    });
    
    suite('GET /api/issues/{project} => Array of objects with issue data', function() {
      
      test('No filter', function(done) {
        chai.request(server)
            .get('/api/issues/test')
            .query({})
            .end(function(err, res){
              assert.equal(res.status, 200);
              assert.isArray(res.body);
              assert.property(res.body[0], 'issue_title');
              assert.property(res.body[0], 'issue_text');
              assert.property(res.body[0], 'created_on');
              assert.property(res.body[0], 'updated_on');
              assert.property(res.body[0], 'created_by');
              assert.property(res.body[0], 'assigned_to');
              assert.property(res.body[0], 'open');
              assert.property(res.body[0], 'status_text');
              assert.property(res.body[0], '_id');
              done();
            });
      })
      
      test('One filter', function(done) {
        chai.request(server)
            .get('/api/issues/test')
            .query({
              assigned_to: 'the dude'
            })
            .end(function(err, res) {
              assert.equal(res.status, 200)
              assert.isArray(res.body)
              assert.lengthOf(res.body, 1)
              done()
            })
      })
      
      test('Multiple filters (test for multiple fields you know will be in the db for a return)', function(done) {
        chai.request(server)
            .get('/api/issues/test')
            .query({
              issue_title: 'new title',
              issue_text: 'new text',
              created_by: 'dude man',
              assigned_to: 'the dude'
            })
            .end(function(err, res) {
              assert.equal(res.status, 200)
              assert.isArray(res.body)
              assert.lengthOf(res.body, 1)
              done()
            })
      })
      
    })
    
    suite('DELETE /api/issues/{project} => text', function() {
      
      test('No _id', function(done) {
        chai.request(server)
            .delete('/api/issues/test')
            .end(function(err, res) {
              assert.equal(res.status, 200)
              assert.equal(res.body, '_id error')
              done()
            })
      })
      
      test('Valid _id', function(done) {
        chai.request(server)
            .get('/api/issues/test')
            .end(function(err, res) {
              const issueId = res.body[0]._id
              chai.request(server)
                  .delete('/api/issues/test')
                  .send({_id: issueId})
                  .end(function(err, res) {
                    assert.equal(res.status, 200)
                    assert.equal(res.body, `success: deleted ${issueId}`)
                    done()
                  })
            })
      });
      
    });

});
