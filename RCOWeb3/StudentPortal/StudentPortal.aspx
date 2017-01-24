<%@ Page Title="" Language="VB" MasterPageFile="StudentPortal.master" AutoEventWireup="false" CodeFile="StudentPortal.aspx.vb" Inherits="StudentPortal_StudentPortal" %>

<asp:Content ID="Content1" ContentPlaceHolderID="MainContent" runat="server">
    
    <!-- page content -->
      <div class="right_col" role="main">

        <div class="">
          <div class="page-title">
            <div class="title_left">
              <h3>Student Portal</h3>
            </div>

            <div class="title_right">
              <div class="col-md-5 col-sm-5 col-xs-12 form-group pull-right top_search">
                <div class="input-group">
                  <input type="text" class="form-control" placeholder="Search for...">
                  <span class="input-group-btn">
                            <button class="btn btn-elegant" type="button">Go!</button>
                        </span>
                </div>
              </div>
            </div>
          </div>
          <div class="clearfix"></div>

          <div class="row">
            <div class="col-md-12">
              <div class="x_panel">
                <div class="x_title">
                  <h2>Current Course Progress</h2>
                  <ul class="nav navbar-right panel_toolbox">
                    <li><a class="collapse-link"><i class="fa fa-chevron-up"></i></a>
                    </li>
                    <li class="dropdown">
                      <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false"><i class="fa fa-wrench"></i></a>
                      <ul class="dropdown-menu" role="menu">
                        <li><a href="#">Settings 1</a>
                        </li>
                        <li><a href="#">Settings 2</a>
                        </li>
                      </ul>
                    </li>
                    <li><a class="close-link"><i class="fa fa-close"></i></a>
                    </li>
                  </ul>
                  <div class="clearfix"></div>
                </div>
                <div class="x_content">

                  <p>Course List</p>

                  <!-- start project list -->
                  <table class="table table-striped projects">
                    <thead>
                      <tr>
                        <th style="width: 1%">#</th>
                        <th style="width: 20%">Course Name</th>
                      
                        <th>Project Progress</th>
                        <th>Status</th>
                        <th style="width: 20%">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>1</td>
                        <td>
                          <a>Believer's Authority</a>
                          <br />
                          <small>Not for Credit</small>
                        </td>
                        
                        <td class="project_progress">
                          <div class="progress progress_sm">
                            <div class="progress-bar bg-green" role="progressbar" data-transitiongoal="57"></div>
                          </div>
                          <small>57% Complete</small>
                        </td>
                        <td>
                          <button type="button" class="btn btn-warning btn-xs">In Progress</button>
                        </td>
                        <td>
                          <a href="#" class="btn btn-primary btn-xs"><i class="fa fa-folder"></i> Resume </a>
                          <a href="#" class="btn btn-info btn-xs"><i class="fa fa-pencil"></i> Convert </a>
                        </td>
                      </tr>
                      <tr>
                        <td>2</td>
                        <td>
                          <a>Believer's Authority 2</a>
                          <br />
                          <small>For Credit</small>
                        </td>
                        
                        <td class="project_progress">
                          <div class="progress progress_sm">
                            <div class="progress-bar bg-green" role="progressbar" data-transitiongoal="100"></div>
                          </div>
                          <small>100% Complete</small>
                        </td>
                        <td>
                          <button type="button" class="btn btn-success btn-xs"><i class='glyphicon glyphicon-star'></i>  Completed</button>
                        </td>
                        <td>
                          <a href="#" class="btn btn-primary btn-xs"><i class="fa fa-folder"></i> View Certificate </a>
                        </td>
                      </tr>
                     
                    </tbody>
                  </table>
                  <!-- end project list -->

                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- footer content -->
        <footer>
          <div class="copyright-info">
            <p class="pull-right">Rhema Chinese Online
            </p>
          </div>
          <div class="clearfix"></div>
        </footer>
        <!-- /footer content -->

      </div>
      <!-- /page content -->

      <script src="../js/bootstrap.min.js"></script>

  <!-- bootstrap progress js -->
  <script src="../js/progressbar/bootstrap-progressbar.min.js"></script>
  <script src="../js/nicescroll/jquery.nicescroll.min.js"></script>
  <!-- icheck -->
  <script src="../js/icheck/icheck.min.js"></script>

  <script src="../js/custom.js"></script>

  <!-- pace -->
  <script src="../js/pace/pace.min.js"></script>
</asp:Content>

