' Launches Duck Scooter Dash: starts a tiny local static file server (hidden,
' no console window) if one isn't already running on the port, then opens
' the game in the default browser. Safe to double-click repeatedly -- if a
' server is already up, the new one just fails to bind and exits quietly.
'
' Unlike a bare "sleep then open browser" approach, this actually polls the
' server until it responds (or a timeout expires) so slow machines don't get
' a blank/404 page, and it shows a real MsgBox if something's actually wrong
' (no Python found, or the server never came up) instead of failing silently.

Dim shell, fso, scriptDir, port, url
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
port = "8934"
url = "http://localhost:" & port & "/index.html"

shell.CurrentDirectory = scriptDir

' --- Make sure Python is actually reachable before we do anything else ---
Dim pyCheck
pyCheck = shell.Run("cmd /c where python >nul 2>&1", 0, True)
If pyCheck <> 0 Then
    MsgBox "Duck Scooter Dash can't find Python on your system." & vbCrLf & vbCrLf & _
           "Install Python from https://python.org (make sure 'Add to PATH' is checked" & _
           " during setup), then try this shortcut again.", vbExclamation, "Duck Scooter Dash - Setup needed"
    WScript.Quit 1
End If

' --- Start the static file server hidden, unless one's already listening ---
shell.Run "cmd /c cd /d """ & scriptDir & """ && python -m http.server " & port, 0, False

' --- Poll until the server actually answers, instead of a blind fixed sleep ---
Dim http, attempt, maxAttempts, ready
Set http = CreateObject("MSXML2.XMLHTTP")
maxAttempts = 20 ' ~10 seconds total (500ms per attempt)
ready = False

For attempt = 1 To maxAttempts
    WScript.Sleep 500
    On Error Resume Next
    http.Open "GET", url, False
    http.Send
    If Err.Number = 0 And http.Status >= 200 And http.Status < 400 Then
        ready = True
    End If
    Err.Clear
    On Error Goto 0
    If ready Then Exit For
Next

If Not ready Then
    MsgBox "Duck Scooter Dash's local server didn't respond in time." & vbCrLf & vbCrLf & _
           "Try closing any leftover 'Duck Scooter Dash - server' windows and double-click" & _
           " the shortcut again. If it keeps happening, something else may be using port " & _
           port & ".", vbExclamation, "Duck Scooter Dash - Launch failed"
    WScript.Quit 1
End If

shell.Run url, 1, False
