# LiquidFillGauge
A LiquidFillGauge with D3.js v4

**use case:**
```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Document</title>

    <script src="http://d3js.org/d3.v4.min.js" language="JavaScript"></script>
  <script src="./liquidFillGauge.js"></script>
  <style>
        .liquidFillGaugeText { font-family: Helvetica; font-weight: bold; }
    </style>
</head>
<body>
  <svg id="fillgauge" width="400" height="250"></svg>
  <script language="JavaScript">
    const gauge = new LiquidFillGauge("fillgauge", 50)
    gauge.render()
    setTimeout(() => {
      gauge.update(75.5)
    }, 1000)
  </script>
</body>
</html>
```
