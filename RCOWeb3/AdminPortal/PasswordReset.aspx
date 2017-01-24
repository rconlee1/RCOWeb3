<%@ Page Title="Password Reset" Language="VB" MasterPageFile="~/AdminPortal/AdminPortal.master" AutoEventWireup="false" CodeFile="PasswordReset.aspx.vb" Inherits="AdminPortal_PasswordReset" %>

<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <div class="right_col" role="main">

            <div class="clearfix"></div>
                <div class="row">
                    <h1><%: Title %></h1>
                </div>
                      <div class="row">
                    <h3>Input the user ID of the user and press submit. A new password will be sent to the email on file.</h3>
                </div>
        <br /><br />
<div class="form-horizontal">
        <div class="form-group">
            <asp:Label runat="server" AssociatedControlID="txt_userID" CssClass="col-md-2 control-label">User ID:</asp:Label>
            <div class="col-md-10">
                <asp:TextBox runat="server" ID="txt_userID" CssClass="form-control" />
                <asp:RequiredFieldValidator runat="server" ControlToValidate="txt_userID"
                    CssClass="text-danger" ErrorMessage="The UserID field is required." />
            </div>
        </div>
            <div class="col-md-offset-2 col-md-10">
                <asp:Button runat="server"  id="submitIDtoMail"  Text="Submit" CssClass="btn btn-default" />
            </div>
        </div>
</div>


</asp:Content>

