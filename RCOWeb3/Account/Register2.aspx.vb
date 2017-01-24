
Partial Class Account_Register2
    Inherits System.Web.UI.Page

    Protected Sub CreateUser_Click(sender As Object, e As EventArgs)
        Dim manager = New UserManager()
        Dim user = New ApplicationUser() With {.UserName = UserName.Text}
        Dim result = manager.Create(user, Password.Text)

        If result.Succeeded Then
            IdentityHelper.SignIn(manager, user, isPersistent:=False)
            IdentityHelper.RedirectToReturnUrl(Request.QueryString("ReturnUrl"), Response)
        Else
            ErrorMessage.Text = result.Errors.FirstOrDefault()
        End If
    End Sub

End Class
