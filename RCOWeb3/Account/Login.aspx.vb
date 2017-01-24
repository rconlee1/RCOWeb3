Imports Microsoft.AspNet.Identity
Imports Microsoft.AspNet.Identity.EntityFramework
Imports Microsoft.AspNet.Identity.Owin
Imports System.Linq
Imports System.Web
Imports System.Web.UI
Imports Microsoft.Owin.Security

Public Partial Class Account_Login
    Inherits Page
    Protected Sub Page_Load(sender As Object, e As EventArgs) Handles Me.Load
        RegisterHyperLink.NavigateUrl = "Register2.aspx"

    End Sub

    Protected Sub LogIn(sender As Object, e As EventArgs)
        If IsValid Then
            ' Validate the user password
            Dim manager = New UserManager()
            Dim user As ApplicationUser = manager.Find(UserName.Text, Password.Text)
            If user IsNot Nothing Then
                IdentityHelper.SignIn(manager, user, RememberMe.Checked)
                Session("UID") = UserName.Text
                IdentityHelper.RedirectToReturnUrl("/StudentPortal/StudentPortal.aspx", Response)
            Else
                FailureText.Text = "Invalid username or password."
                ErrorMessage.Visible = True
            End If
        End If
    End Sub
End Class
