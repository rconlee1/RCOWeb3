
Partial Class StudentPortal_StudentPortal
    Inherits System.Web.UI.MasterPage




    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
        Response.Cache.SetCacheability(HttpCacheability.NoCache)
        If Session("UID") = "" Then Response.Redirect("../Default.aspx")

    End Sub

    Private Sub LoginStatus1_LoggedOut(sender As Object, e As EventArgs) Handles LoginStatus1.LoggedOut
        Session("UID") = ""
    End Sub

    Private Sub StudentPortal_StudentPortal_Unload(sender As Object, e As EventArgs) Handles Me.Unload

    End Sub
End Class
