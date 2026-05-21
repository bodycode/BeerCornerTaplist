Option Explicit

Const SERVER_URL As String = "http://your-server-address:3000"

Private Function UploadFile(filePath As String, uploadUrl As String) As Boolean
    Dim boundary As String
    Dim CRLF As String
    Dim header As String
    Dim footer As String
    Dim fileBytes() As Byte
    Dim headerBytes() As Byte
    Dim footerBytes() As Byte
    Dim bodyBytes() As Byte
    Dim http As Object
    Dim fs As Object
    Dim stream As Object

    boundary = "--------------------------" & Format(Now, "yyyymmddhhnnss")
    CRLF = vbCrLf

    Set fs = CreateObject("Scripting.FileSystemObject")
    If Not fs.FileExists(filePath) Then
        UploadFile = False
        Exit Function
    End If

    Set stream = CreateObject("ADODB.Stream")
    stream.Type = 1 ' binary
    stream.Open
    stream.LoadFromFile filePath
    fileBytes = stream.Read
    stream.Close

    header = "--" & boundary & CRLF _
           & "Content-Disposition: form-data; name=""menuImage""; filename=""" & fs.GetFileName(filePath) & """" & CRLF _
           & "Content-Type: image/jpeg" & CRLF & CRLF
    footer = CRLF & "--" & boundary & "--" & CRLF

    headerBytes = StrConv(header, vbFromUnicode)
    footerBytes = StrConv(footer, vbFromUnicode)

    ReDim bodyBytes(0 To UBound(headerBytes) + UBound(fileBytes) + UBound(footerBytes) + 2) As Byte
    Dim pos As Long
    pos = 0
    CopyMemory bodyBytes, headerBytes, UBound(headerBytes) + 1, pos
    pos = pos + UBound(headerBytes) + 1
    CopyMemory bodyBytes, fileBytes, UBound(fileBytes) + 1, pos
    pos = pos + UBound(fileBytes) + 1
    CopyMemory bodyBytes, footerBytes, UBound(footerBytes) + 1, pos

    Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    http.Open "POST", uploadUrl, False
    http.setRequestHeader "Content-Type", "multipart/form-data; boundary=" & boundary
    http.send bodyBytes

    UploadFile = (http.Status = 200)
End Function

Private Sub CopyMemory(dest() As Byte, src() As Byte, count As Long, destStart As Long)
    Dim i As Long
    For i = 0 To count - 1
        dest(destStart + i) = src(i)
    Next i
End Sub

Private Sub ExportAsJpgAndUpload(rng As Range, targetUrl As String)
    Dim tempPath As String
    Dim cht As ChartObject
    Dim shp As Shape
    Dim copiedRange As Range

    Set copiedRange = rng
    copiedRange.Copy
    ActiveSheet.Pictures.Paste link:=False
    Set shp = ActiveSheet.Shapes(ActiveWindow.Selection.Name)

    tempPath = Environ("TEMP") & "\" & rng.Parent.Name & "_" & rng.Address(False, False) & ".jpg"
    tempPath = Replace(tempPath, ":", "")
    tempPath = Replace(tempPath, " ", "")

    Set cht = ActiveSheet.ChartObjects.Add( _
        Left:=shp.Left, _
        Width:=shp.Width, _
        Top:=shp.Top, _
        Height:=shp.Height)
    cht.ShapeRange.Fill.Visible = msoFalse
    cht.ShapeRange.Line.Visible = msoFalse

    shp.Copy
    cht.Activate
    cht.Chart.Paste
    cht.Chart.Export Filename:=tempPath, FilterName:="JPG"

    shp.Delete
    cht.Delete

    If UploadFile(tempPath, targetUrl) Then
        Debug.Print "Uploaded " & tempPath & " to " & targetUrl
    Else
        Debug.Print "Upload failed: " & targetUrl
    End If
End Sub

Sub UploadMenusToWebsite()
    Dim taplistRange As Range
    Dim milkshakeP1Range As Range
    Dim milkshakeP2Range As Range

    Set taplistRange = Sheets("Taplist").Range("B2:Q56")
    Set milkshakeP1Range = Sheets("BEERS").Range("B1:G36")
    Set milkshakeP2Range = Sheets("BEERS").Range("I1:N36")

    ExportAsJpgAndUpload taplistRange, SERVER_URL & "/upload/taplist"
    ExportAsJpgAndUpload milkshakeP1Range, SERVER_URL & "/upload/milkshakep1"
    ExportAsJpgAndUpload milkshakeP2Range, SERVER_URL & "/upload/milkshakep2"

    MsgBox "Menu images uploaded to website."
End Sub
