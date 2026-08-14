' Launches Duck Scooter Dash: starts a tiny local static file server (hidden,
' no console window) if one isn't already running on the port, then opens
' the game in the default browser. Safe to double-click repeatedly -- if a
' server is already up, we just reuse it.
'
' Unlike a bare "sleep then open browser" approach, this polls the server
' until it responds (or a timeout expires) so slow machines don't get a
' blank/404 page, and it shows a real MsgBox if something's actually wrong
' instead of failing silently.
'
' ---------------------------------------------------------------------------
' WHY WE DO NOT JUST RUN "python" (this cost a real embarrassment):
'
' This machine has NO real Python on the persisted user PATH. The only entry
' is C:\Users\Jake\AppData\Local\Microsoft\WindowsApps, which holds Microsoft's
' APP EXECUTION ALIAS - a stub that prints "Python was not found; run without
' arguments to install from the Microsoft Store" and DOES NOT run any code.
'
' The old version of this script guarded with `where python`, which SUCCEEDS
' (exit 0) because the stub file genuinely exists on the PATH. So the guard
' passed, the server was never actually started, and the shortcut just sat
' there doing nothing. The MsgBox that was supposed to explain the problem
' never fired, because from `where`'s point of view nothing was wrong.
'
' A developer shell inherits a much richer PATH (uv puts a real interpreter on
' it), which is precisely why this was invisible during testing: it worked for
' the person who wrote it and failed for the person who double-clicks it.
' start_duck_scooter.bat had already learned this lesson and resolves the
' interpreter by ABSOLUTE PATH - that fix simply never made it into this file,
' which is the one the desktop shortcut actually runs.
'
' So: resolve the interpreter by absolute path, and then PROVE it can execute
' before trusting it. Existence is not the same as usability - the Store stub
' exists and is useless.
' ---------------------------------------------------------------------------

Option Explicit

Dim shell, fso, scriptDir, port, url, pyExe
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
port = "8934"
url = "http://localhost:" & port & "/index.html"

shell.CurrentDirectory = scriptDir

' --- Find a Python that can actually execute code -------------------------
pyExe = FindPython()
If pyExe = "" Then
    MsgBox "Duck Scooter Dash couldn't find a working Python to run its " & _
           "local server." & vbCrLf & vbCrLf & _
           "Note: Windows ships a fake 'python' that only opens the " & _
           "Microsoft Store - that one doesn't count, and it's why a " & _
           "plain PATH check isn't enough." & vbCrLf & vbCrLf & _
           "Install Python from https://python.org (tick 'Add to PATH'), " & _
           "then try this shortcut again.", _
           vbExclamation, "Duck Scooter Dash - Setup needed"
    WScript.Quit 1
End If

' --- Start the server hidden, unless one's already listening --------------
' NOTE: python.exe, NOT pythonw.exe. http.server writes a log line to stderr
' for every request; pythonw.exe has no stderr handle, so that write raises
' and the connection dies mid-response. The port still LISTENS, which makes
' it look alive while every single request fails (curl: status 000). Hiding
' the console is the job of the window-style 0 argument below -- not of
' picking a windowless interpreter that can't do the work.
If Not ServerIsUp() Then
    shell.Run """" & pyExe & """ -m http.server " & port, 0, False
End If

' --- Poll until the server actually answers, instead of a blind sleep -----
Dim attempt, ready
ready = False
For attempt = 1 To 20   ' ~10 seconds total
    If ServerIsUp() Then
        ready = True
        Exit For
    End If
    WScript.Sleep 500
Next

If Not ready Then
    MsgBox "Duck Scooter Dash's local server didn't respond in time." & _
           vbCrLf & vbCrLf & _
           "Something else may be using port " & port & ". Try again, and " & _
           "if it keeps happening, restart and give it another go.", _
           vbExclamation, "Duck Scooter Dash - Launch failed"
    WScript.Quit 1
End If

shell.Run url, 1, False


' ==========================================================================

Function FindPython()
    ' The first interpreter that EXISTS and actually runs. Ordered
    ' uv installs first (DISCOVERED, never hardcoded -- a pinned version list
    ' is just a snapshot of one machine on one day and rots the moment uv
    ' upgrades), then the bare names so a properly-installed Python on the
    ' PATH still wins on someone else's box.
    Dim exe

    exe = NewestUvPython()
    If exe <> "" Then
        FindPython = exe
        Exit Function
    End If

    ' Bare name: let the PATH resolve it, but still prove it runs. This is
    ' the check that catches the Microsoft Store stub, which exists on the
    ' PATH and cannot execute a single line of code.
    If CanRun("python.exe") Then
        FindPython = "python.exe"
    Else
        FindPython = ""
    End If
End Function


Function NewestUvPython()
    ' Scan %APPDATA%\uv\python for interpreter installs and return the
    ' newest one that actually runs. Folder names sort usefully enough
    ' (cpython-3.11... < cpython-3.14...), so we walk them in reverse.
    Dim root, folders, f, names, i, j, tmp, exe
    NewestUvPython = ""
    root = shell.ExpandEnvironmentStrings("%APPDATA%") & "\uv\python"
    If Not fso.FolderExists(root) Then Exit Function

    Set folders = fso.GetFolder(root).SubFolders
    ReDim names(0)
    i = 0
    For Each f In folders
        If Left(f.Name, 1) <> "." Then   ' skip uv's .temp scratch dir
            ReDim Preserve names(i)
            names(i) = f.Name
            i = i + 1
        End If
    Next
    If i = 0 Then Exit Function

    ' Plain bubble sort ascending -- the list is a handful of entries, so
    ' clarity beats cleverness here.
    For i = 0 To UBound(names) - 1
        For j = 0 To UBound(names) - i - 1
            If names(j) > names(j + 1) Then
                tmp = names(j)
                names(j) = names(j + 1)
                names(j + 1) = tmp
            End If
        Next
    Next

    For i = UBound(names) To 0 Step -1   ' newest first
        ' python.exe deliberately -- see the note at the server launch above:
        ' pythonw.exe cannot serve http.server requests at all.
        exe = root & "\" & names(i) & "\python.exe"
        If fso.FileExists(exe) Then
            If CanRun(exe) Then
                NewestUvPython = exe
                Exit Function
            End If
        End If
    Next
End Function


Function CanRun(exe)
    ' Ask the interpreter to do something trivial and check it succeeded.
    ' EXISTENCE IS NOT USABILITY: the Store stub satisfies `where` and then
    ' refuses to execute, so only actually running it tells the truth.
    Dim code
    On Error Resume Next
    code = shell.Run("cmd /c """"" & exe & """ -c ""pass""""", 0, True)
    If Err.Number <> 0 Then
        Err.Clear
        CanRun = False
    Else
        CanRun = (code = 0)
    End If
    On Error Goto 0
End Function


Function ServerIsUp()
    ' A GET against the real URL. Doubles as the "is one already running?"
    ' check, so we never start a second server that would just fail to bind -
    ' and never wait on one that's already serving.
    Dim http
    ServerIsUp = False
    On Error Resume Next
    Set http = CreateObject("MSXML2.XMLHTTP")
    http.Open "GET", url, False
    http.Send
    If Err.Number = 0 Then
        If http.Status >= 200 And http.Status < 400 Then ServerIsUp = True
    End If
    Err.Clear
    On Error Goto 0
End Function
