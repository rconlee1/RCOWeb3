﻿<%@ Page Title="Student Profile" Language="VB" MasterPageFile="StudentPortal.master" AutoEventWireup="false" CodeFile="StudentProfile.aspx.vb" Inherits="StudentPortal_StudentProfile" %>

<asp:Content ID="Content1" ContentPlaceHolderID="MainContent" Runat="Server">
 <div class="right_col" role="main">

          <div class="">

            <div class="clearfix"></div>
    <div class="row">
    <h1><%: Title %></h1>
    <p class="text-danger">
        <asp:Literal runat="server" ID="ErrorMessage" />
    </p>

    <div class="form-horizontal">
        <h2>Edit your profile and press Update.</h2>
        <hr />
        <asp:ValidationSummary runat="server" CssClass="text-danger" />

                    <div class="form-group">
                        <div class="col-md-2">
                        <asp:Button ID="Button2" class="btn btn-success" runat="server" Text="Load Photo"></asp:Button>

                        </div>
                        <div class="col-md-10">
                        <div id="crop-avatar">
                          <!-- Current avatar -->
                          <img class="img-responsive avatar-view " src="../images/sean.jpg" alt="Avatar" title="Change the avatar">
                        </div>
                      </div>

                    </div>




        <div class="form-group">
            <asp:Label runat="server" AssociatedControlID="txt_FirstName" CssClass="col-md-2 control-label">First Name</asp:Label>
            <div class="col-md-10">
                <asp:TextBox runat="server" ID="txt_FirstName" CssClass="form-control" />
                <asp:RequiredFieldValidator runat="server" ControlToValidate="txt_FirstName"
                    CssClass="text-danger" ErrorMessage="The First Name field is required." />
            </div>
        </div>
        <div class="form-group">
            <asp:Label runat="server" AssociatedControlID="txt_LastName" CssClass="col-md-2 control-label">Last Name</asp:Label>
            <div class="col-md-10">
                <asp:TextBox runat="server" ID="txt_LastName" CssClass="form-control" />
                <asp:RequiredFieldValidator runat="server" ControlToValidate="txt_LastName"
                    CssClass="text-danger" ErrorMessage="The Last Name field is required." />
            </div>
        </div>
                <div class="form-group">
            <asp:Label runat="server" AssociatedControlID="drop_country" CssClass="col-md-2 control-label">Country</asp:Label>
            <div class="col-md-10">
                <asp:DropDownList ID="drop_country" CssClass="form-control" runat="server" DataSourceID="SqlDataSource1" DataTextField="country_name" DataValueField="country_id"></asp:DropDownList>
                <asp:RequiredFieldValidator runat="server" ControlToValidate="drop_country"
                    CssClass="text-danger" ErrorMessage="The Country field is required." />
            </div>
        </div>
        <div class="form-group">
            <asp:Label runat="server" AssociatedControlID="drop_province" CssClass="col-md-2 control-label">Province/State</asp:Label>
            <div class="col-md-10">
                <asp:DropDownList ID="drop_province" CssClass="form-control" runat="server" DataSourceID="SqlDataSource2" DataTextField="prov_name" DataValueField="prov_id"></asp:DropDownList>
                <asp:RequiredFieldValidator runat="server" ControlToValidate="drop_province"
                    CssClass="text-danger" ErrorMessage="The Province/State field is required." />
            </div>
        </div>
                <div class="form-group">
            <asp:Label runat="server" AssociatedControlID="drop_language" CssClass="col-md-2 control-label">Language Preferred</asp:Label>
            <div class="col-md-10">
                <asp:DropDownList ID="drop_language" CssClass="form-control" runat="server" DataSourceID="SqlDataSource3" DataTextField="lang_name" DataValueField="lang_id"></asp:DropDownList>
                <asp:RequiredFieldValidator runat="server" ControlToValidate="drop_language"
                    CssClass="text-danger" ErrorMessage="The Language Preference field is required." />
            </div>
        </div>
                <div class="form-group">
            <asp:Label runat="server" AssociatedControlID="txt_email" CssClass="col-md-2 control-label">Email</asp:Label>
            <div class="col-md-10">
                <asp:TextBox runat="server" ID="txt_email" textmode="Email" CssClass="form-control" />
                <asp:RequiredFieldValidator runat="server" ControlToValidate="txt_email"
                    CssClass="text-danger" ErrorMessage="The Email field is required." />
            </div>
        </div>
                <div class="form-group">
            <asp:Label runat="server" AssociatedControlID="txt_confemail" CssClass="col-md-2 control-label">Confirm Email</asp:Label>
            <div class="col-md-10">
                <asp:TextBox runat="server" ID="txt_confemail" CssClass="form-control" />
                <asp:RequiredFieldValidator runat="server" ControlToValidate="txt_confemail"
                    CssClass="text-danger" ErrorMessage="The Confirm Email field is required." />
                <asp:CompareValidator ID="emailcompare1" runat="server" ErrorMessage="Email doesn't match" ControlToCompare="txt_email" ControlToValidate="txt_confemail"></asp:CompareValidator>
            </div>
        </div>
        <div class="form-group">
            <asp:Label runat="server" AssociatedControlID="UserName" CssClass="col-md-2 control-label">User name</asp:Label>
            <div class="col-md-10">
                <asp:TextBox runat="server" ID="UserName" CssClass="form-control" />
                <asp:RequiredFieldValidator runat="server" ControlToValidate="UserName"
                    CssClass="text-danger" ErrorMessage="The user name field is required." />
            </div>
        </div>
        <div class="form-group">
            <asp:Label runat="server" AssociatedControlID="Password" CssClass="col-md-2 control-label">Password</asp:Label>
            <div class="col-md-10">
                <asp:TextBox runat="server" ID="Password" TextMode="Password" CssClass="form-control" />
                <asp:RequiredFieldValidator runat="server" ControlToValidate="Password"
                    CssClass="text-danger" ErrorMessage="The password field is required." />
            </div>
        </div>
        <div class="form-group">
            <asp:Label runat="server" AssociatedControlID="ConfirmPassword" CssClass="col-md-2 control-label">Confirm Password</asp:Label>
            <div class="col-md-10">
                <asp:TextBox runat="server" ID="ConfirmPassword" TextMode="Password" CssClass="form-control" />
                <asp:RequiredFieldValidator runat="server" ControlToValidate="ConfirmPassword"
                    CssClass="text-danger" Display="Dynamic" ErrorMessage="The confirm password field is required." />
                <asp:CompareValidator runat="server" ControlToCompare="Password" ControlToValidate="ConfirmPassword"
                    CssClass="text-danger" Display="Dynamic" ErrorMessage="The password and confirmation password do not match." />
            </div>
        </div>
        <div class="form-group">
            <div class="col-md-offset-2 col-md-10">
                <asp:Button runat="server"  id="submitTocheck"  Text="Update" CssClass="btn btn-default" />
            </div>
            <asp:SqlDataSource ID="SqlDataSource5" runat="server" ConnectionString="<%$ ConnectionStrings:RCOWeb2ConnectionString %>" SelectCommand="SELECT [Id], [Name] FROM [AspNetRoles]"></asp:SqlDataSource>
            <asp:SqlDataSource ID="SqlDataSource4" runat="server" ConnectionString="<%$ ConnectionStrings:RCOWeb2ConnectionString %>" SelectCommand="SELECT [activate_id], [activate_name] FROM [Act_Deact]"></asp:SqlDataSource>
        </div>

                            </div>
            </div>
        </div>
              </div>



    <asp:SqlDataSource ID="SqlDataSource1" runat="server" ConnectionString="<%$ ConnectionStrings:RCOWeb2ConnectionString %>" SelectCommand="SELECT [country_id], [country_name] FROM [Country]"></asp:SqlDataSource>
                   <asp:SqlDataSource ID="SqlDataSource2" runat="server" ConnectionString="<%$ ConnectionStrings:RCOWeb2ConnectionString %>" SelectCommand="SELECT [prov_name], [prov_id] FROM [Prov_State]"></asp:SqlDataSource>
                   <asp:SqlDataSource ID="SqlDataSource3" runat="server" ConnectionString="<%$ ConnectionStrings:RCOWeb2ConnectionString %>" SelectCommand="SELECT [lang_name], [lang_id] FROM [Languages]"></asp:SqlDataSource>


                 
</asp:Content>

