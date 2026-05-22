Option Explicit

Const SERVER_URL As String = "https://beercornertaplist.onrender.com"

Private Function UploadImageToWebsite(filePath As String, uploadUrl As String) As Boolean
    On Error GoTo ErrorHandler
    
    Dim http As Object
    Dim fs As Object
    Dim stream As Object
    Dim fileBytes() As Byte

    Set fs = CreateObject("Scripting.FileSystemObject")
    If Not fs.FileExists(filePath) Then
        Debug.Print "File not found: " & filePath
        UploadImageToWebsite = False
        Exit Function
    End If

    ' Read file as binary
    Set stream = CreateObject("ADODB.Stream")
    stream.Type = 1
    stream.Open
    stream.LoadFromFile filePath
    fileBytes = stream.Read
    stream.Close
    Set stream = Nothing

    ' Send as raw binary image data
    Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    http.Open "POST", uploadUrl, False
    http.SetRequestHeader "Content-Type", "image/jpeg"
    http.Send fileBytes

    Debug.Print "Upload to " & uploadUrl & " - Status: " & http.Status
    Debug.Print "Response: " & http.ResponseText

    If http.Status = 200 Then
        UploadImageToWebsite = True
    Else
        UploadImageToWebsite = False
    End If

    Set http = Nothing
    Exit Function

ErrorHandler:
    Debug.Print "Upload error: " & Err.Description & " (" & Err.Number & ")"
    UploadImageToWebsite = False
End Function

Private Function TestServerConnection(serverUrl As String) As Boolean
    On Error GoTo ErrorHandler
    
    Dim http As Object
    Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    http.Open "GET", serverUrl & "/taplist", False
    http.send
    
    Debug.Print "Server test status: " & http.Status
    
    If http.Status = 200 Then
        TestServerConnection = True
    Else
        TestServerConnection = False
    End If
    
    Set http = Nothing
    Exit Function
    
ErrorHandler:
    Debug.Print "Server test error: " & Err.Description
    TestServerConnection = False
End Function

Sub Taplist()

'Create and assign variables
Dim saveLocationTaplist As String
Dim saveLocationMilkshakep1 As String
Dim saveLocationMilkshakep2 As String
Dim ws As Worksheet
Dim rng As Range

Dim cht As ChartObject
Dim ActiveShape As Shape

'TEST: Check if server is reachable
If Not TestServerConnection(SERVER_URL) Then
    MsgBox "Cannot reach server: " & SERVER_URL & vbCrLf & "Check your internet connection or the server URL."
    Exit Sub
End If

Application.ScreenUpdating = False
ActiveSheet.Unprotect Password:="lavish123"
Application.DisplayAlerts = False
    
Sheets("Taplist").Select
Range("b2:Q56").Select
'Confirm if a Cell Range is currently selected
  If TypeName(Selection) <> "Range" Then
    MsgBox "You do not have a single shape selected!"
    Exit Sub
  End If

'Copy/Paste Cell Range as a Picture
  Selection.Copy
  ActiveSheet.Pictures.Paste(link:=False).Select
  Set ActiveShape = ActiveSheet.Shapes(ActiveWindow.Selection.Name)
  
'Create a temporary chart object (same size as shape)
  Set cht = ActiveSheet.ChartObjects.Add( _
    Left:=ActiveCell.Left, _
    Width:=ActiveShape.Width, _
    Top:=ActiveCell.Top, _
    Height:=ActiveShape.Height)

'Format temporary chart to have a transparent background
  cht.ShapeRange.Fill.Visible = msoFalse
  cht.ShapeRange.Line.Visible = msoFalse
    
'Copy/Paste Shape inside temporary chart
 ActiveShape.Copy
  cht.Activate
  ActiveChart.Paste
  
'Save chart to User's Desktop as PNG File
  cht.Chart.Export "Q:\Hospitality Collection\Petition Beer Corner\1.MENUS & PRINTING\TaplistMenu.jpg"
  
'Upload to Render
  If UploadImageToWebsite("Q:\Hospitality Collection\Petition Beer Corner\1.MENUS & PRINTING\TaplistMenu.jpg", SERVER_URL & "/upload/taplist") Then
    Debug.Print "Taplist uploaded successfully"
  Else
    Debug.Print "Taplist upload failed"
    MsgBox "Taplist upload failed. Check your connection or server URL."
  End If

'Delete temporary Chart
  cht.Delete
  ActiveShape.Delete
  
Sheets("BEERS").Select
ActiveSheet.Unprotect Password:="lavish123"
Range("b1:G36").Select
'Confirm if a Cell Range is currently selected
  If TypeName(Selection) <> "Range" Then
    MsgBox "You do not have a single shape selected!"
    Exit Sub
  End If

'Copy/Paste Cell Range as a Picture
  Selection.Copy
  ActiveSheet.Pictures.Paste(link:=False).Select
  Set ActiveShape = ActiveSheet.Shapes(ActiveWindow.Selection.Name)
  
'Create a temporary chart object (same size as shape)
  Set cht = ActiveSheet.ChartObjects.Add( _
    Left:=ActiveCell.Left, _
    Width:=ActiveShape.Width, _
    Top:=ActiveCell.Top, _
    Height:=ActiveShape.Height)

'Format temporary chart to have a transparent background
  cht.ShapeRange.Fill.Visible = msoFalse
  cht.ShapeRange.Line.Visible = msoFalse
    
'Copy/Paste Shape inside temporary chart
 ActiveShape.Copy
  cht.Activate
  ActiveChart.Paste
  
'Save chart to User's Desktop as PNG File
  cht.Chart.Export "Q:\Hospitality Collection\Petition Beer Corner\1.MENUS & PRINTING\MilkshakeP1.jpg"

'Upload to Render
  If UploadImageToWebsite("Q:\Hospitality Collection\Petition Beer Corner\1.MENUS & PRINTING\MilkshakeP1.jpg", SERVER_URL & "/upload/milkshakep1") Then
    Debug.Print "MilkshakeP1 uploaded successfully"
  Else
    Debug.Print "MilkshakeP1 upload failed"
    MsgBox "MilkshakeP1 upload failed. Check your connection or server URL."
  End If

'Delete temporary Chart
  cht.Delete
  ActiveShape.Delete
  
Sheets("BEERS").Select
Range("i1:n36").Select
'Confirm if a Cell Range is currently selected
  If TypeName(Selection) <> "Range" Then
    MsgBox "You do not have a single shape selected!"
    Exit Sub
  End If

'Copy/Paste Cell Range as a Picture
  Selection.Copy
  ActiveSheet.Pictures.Paste(link:=False).Select
  Set ActiveShape = ActiveSheet.Shapes(ActiveWindow.Selection.Name)
  
'Create a temporary chart object (same size as shape)
  Set cht = ActiveSheet.ChartObjects.Add( _
    Left:=ActiveCell.Left, _
    Width:=ActiveShape.Width, _
    Top:=ActiveCell.Top, _
    Height:=ActiveShape.Height)

'Format temporary chart to have a transparent background
  cht.ShapeRange.Fill.Visible = msoFalse
  cht.ShapeRange.Line.Visible = msoFalse
    
'Copy/Paste Shape inside temporary chart
 ActiveShape.Copy
  cht.Activate
  ActiveChart.Paste
  
'Save chart to User's Desktop as PNG File
  cht.Chart.Export "Q:\Hospitality Collection\Petition Beer Corner\1.MENUS & PRINTING\MilkshakeP2.jpg"

'Upload to Render
  If UploadImageToWebsite("Q:\Hospitality Collection\Petition Beer Corner\1.MENUS & PRINTING\MilkshakeP2.jpg", SERVER_URL & "/upload/milkshakep2") Then
    Debug.Print "MilkshakeP2 uploaded successfully"
  Else
    Debug.Print "MilkshakeP2 upload failed"
    MsgBox "MilkshakeP2 upload failed. Check your connection or server URL."
  End If

'Delete temporary Chart
  cht.Delete
  ActiveShape.Delete

ActiveSheet.Protect Password:="lavish123"

Sheets("Taplist").Select
ActiveSheet.Unprotect Password:="lavish123"

'Declare Variables
Dim EmailApp As Object
Dim EmailItem As Object
Dim myAttachments As Object
Dim Fonsworth As String
Fonsworth = "Q:\Food & Beverage\Cost Sheets\Images\Goodnews.jpg"

'Set Variables
Set EmailApp = CreateObject("Outlook.application")
Set EmailItem = EmailApp.CreateItem(0)
Set myAttachments = EmailItem.Attachments

'Specify Email Items and Add Attachment
With EmailItem
.To = Range("E64").Value
.CC = Range("E65").Value & ";" & Range("E66").Value & ";" & Range("E67").Value
.BCC = "bodycote747@gmail.com"
.Subject = "Now Pouring!!!"
.Attachments.Add "Q:\Hospitality Collection\Petition Beer Corner\1.MENUS & PRINTING\TaplistMenu.jpg"
.Attachments.Add "Q:\Hospitality Collection\Petition Beer Corner\1.MENUS & PRINTING\MilkshakeP1.jpg"
.Attachments.Add "Q:\Hospitality Collection\Petition Beer Corner\1.MENUS & PRINTING\MilkshakeP2.jpg"
.Attachments.Add Fonsworth, 1, 0
.HTMLBody = "<html><body><p>##Fonsworth##</p>" & "<p> Good news " & Range("C64").Value & " , " & Range("C65").Value & " & " & Range("c66").Value & "!</p>" & "<p>We have a NEW BEER!!!</p>" & "<p> Post this to our story</p>" & "<p></p>" & "<p>Thank you,</p>" & "<p></p>" & "<p>Matt Bodycote"
.HTMLBody = Replace(.HTMLBody, "##Fonsworth##", "<img src=""cid:Goodnews.jpg""height=256 width=256>")
            If DisplayEmail = False Then
            
                .send
                
            End If
        
End With
Set EmailItem = Nothing
Set EmailApp = Nothing

ActiveSheet.Protect Password:="lavish123"
Application.ScreenUpdating = True

MsgBox "Menu updated and uploaded to website!"

End Sub
