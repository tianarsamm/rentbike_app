Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /k cd /d c:\KULIAH\Semester V\Pemrograman Mobile\RentRide\RentBike && echo Y | eas build --platform android --profile production"
WScript.Sleep 2000
WshShell.SendKeys "Y~"
Wscript.Quit

