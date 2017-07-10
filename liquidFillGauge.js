class DefaultSettings {
  constructor() {
    this.minValue = 0 // 量度最小值
    this.maxValue = 100 // 量度最大值
    this.circleThickness = 0.05 // 外圆厚度--半径百分占比
    this.circleFillGap = 0.05  // 外圆和内部之间的间隔--半径百分占比
    this.circleColor = '#178BCA' // 外圆颜色
    this.waveHeight = 0.05 // 波浪高度--半径百分占比
    this.waveCount = 1 // 波浪数量
    this.waveRiseTime = 1000
    this.waveAnimateTime = 18000
    this.waveRise = true
    this.waveHeightScaling = true
    this.waveAnimate = true
    this.waveColor = '#178BCA' // 波浪颜色
    this.waveOffset = 0
    this.textVertPosition = 0.5 // 文字在竖直方向上的高度 0 = bottom, 1 = top
    this.textSize = 1 // 文字相对于内圆的高度 1 = 50%
    this.valueCountUp = true
    this.displayPercent = true // 是否显示百分号
    this.textColor = '#045681' // 文字颜色
    this.waveTextColor = '#A4DBf8' // 波浪覆盖着的文字颜色
  }
}

function buildTextRounder(value) {
  let textRounder = function (value) { return Math.round(value); };
  if (parseFloat(value) != parseFloat(textRounder(value))) {
    console.log('1')
    textRounder = function (value) { return parseFloat(value).toFixed(1); };
  }
  if (parseFloat(value) != parseFloat(textRounder(value))) {
    console.log('2')
    textRounder = function (value) { return parseFloat(value).toFixed(2); };
  }
  return textRounder
}

function buildTextTween(textRounder, percentText, textFinalValue) {
  return function textTween() {
    const text = this.textContent || textRounder(0) + percentText
    const interpolate = d3.interpolate(text, textFinalValue)
    return (t) => {
      this.textContent = textRounder(interpolate(t)) + percentText
    }
  }
}

class LiquidFillGauge {
  constructor(elementId, value, config) {
    this.elementId = elementId
    this.value = value
    this.config = (config === undefined) ? new DefaultSettings() : config
    this.render = this.render.bind(this)
  }

  render() {
    const gauge = d3.select(`#${this.elementId}`)
    const width = parseInt(gauge.style('width'))
    const heigth = parseInt(gauge.style('height'))
    const radius = Math.min(width, heigth) / 2
    const locationX = width / 2 - radius
    const locationY = heigth / 2 - radius
    const fillPercent = Math.max(this.config.minValue, Math.min(this.config.maxValue, this.value)) / this.config.maxValue
    const waveHeightScale = this.config.waveHeightScaling ? d3.scaleLinear().domain([0, 0.5, 1]).range([0, this.config.waveHeight, 0]) :
      d3.scaleLinear().domain([0, 1]).range([this.config.waveHeight, this.config.waveHeight])
    const textVertPosition = this.config.textVertPosition
    const textPixels = this.config.textSize * radius / 2
    const textFinalValue = parseFloat(this.value).toFixed(2)
    const textStartValue = this.config.valueCountUp ? this.config.minValue : textFinalValue
    const percentText = this.config.displayPercent ? '%' : ''
    const circleThickness = this.config.circleThickness * radius
    const circleFillGap = this.config.circleFillGap * radius
    const fillCircleMargin = circleThickness + circleFillGap
    const fillCircleRadius = radius - fillCircleMargin
    const waveHeight = fillCircleRadius * waveHeightScale(fillPercent)
    const waveLength = fillCircleRadius * 2 / this.config.waveCount
    const waveClipCount = 1 + this.config.waveCount
    const waveClipWidth = waveClipCount * waveLength
    const textRounder = buildTextRounder(this.value)
    const textTween = buildTextTween(textRounder, percentText, textFinalValue)

    const clipData = []
    for (let i = 0; i <= 40 * waveClipCount; i++) {
      clipData.push({ x: i / (40 * waveClipCount), y: (i / (40)) })
    }

    // 刻度尺
    const waveScaleX = d3.scaleLinear().domain([0, 1]).range([0, waveClipWidth])
    const waveScaleY = d3.scaleLinear().domain([0, 1]).range([0, waveHeight])

    const waveRiseScale = d3.scaleLinear().domain([0, 1]).range([fillCircleMargin + 2 * fillCircleRadius + waveHeight, fillCircleMargin - waveHeight])

    const waveAnimateScale = d3.scaleLinear().domain([0, 1]).range([0, waveClipWidth - 2 * fillCircleRadius])

    const textRiseScaleY = d3.scaleLinear().domain([0, 1]).range([fillCircleMargin + 2 * fillCircleRadius, fillCircleMargin + textPixels * 0.7])
    // 将 <g> 置于 <svg>的中心
    const gaugeGroup = gauge.append('g')
      .attr('transform', `translate(${locationX}, ${locationY})`)

    // 画外圆
    const circleArc = d3.arc()
      .startAngle(0)
      .endAngle(2 * Math.PI)
      .outerRadius(radius)
      .innerRadius(radius - circleThickness)

    gaugeGroup.append('path')
      .attr('d', circleArc)
      .style('fill', this.config.circleColor)
      .attr('transform', `translate(${radius}, ${radius})`)

    // 文字
    const text1 = gaugeGroup.append('text')
      .text(textRounder(textStartValue) + percentText)
      .attr('class', 'liquidFillGaugeText')
      .attr('text-anchor', 'middle')
      .attr('font-size', textPixels + 'px')
      .style('fill', this.config.textColor)
      .attr('transform', `translate(${radius}, ${textRiseScaleY(textVertPosition)})`)

    // 裁剪区域
    function alipAreaX(d) {
      return waveScaleX(d.x)
    }

    const waveOffset = this.config.waveOffset
    const waveCount = this.config.waveCount
    function alipAreaY0(d) {
      return waveScaleY(Math.sin(Math.PI * 2 * waveOffset * -1 + Math.PI * 2 * (1 - waveCount) + d.y * 2 * Math.PI))
    }

    function alipAreaY1(d) {
      return 2 * fillCircleRadius + waveHeight
    }

    const clipArea = d3.area()
      .x(alipAreaX)
      .y0(alipAreaY0)
      .y1(alipAreaY1)

    const waveGroup = gaugeGroup.append('defs')
      .append('clipPath')
      .attr('id', `clipWave${this.elementId}`)

    const wave = waveGroup.append('path')
      .datum(clipData)
      .attr('d', clipArea)
      .attr('T', 0)

    // 使用裁剪画内部圆
    const fillCircleGroup = gaugeGroup.append('g')
      .attr('clip-path', `url(#clipWave${this.elementId})`)

    fillCircleGroup.append('circle')
      .attr('cx', radius)
      .attr('cy', radius)
      .attr('r', fillCircleRadius)
      .style('fill', this.config.waveColor)

    const text2 = fillCircleGroup.append('text')
      .text(textRounder(textStartValue) + percentText)
      .attr('class', 'liquidFillGaugeText')
      .attr('text-anchor', 'middle')
      .attr('font-size', textPixels + 'px')
      .style('fill', this.config.waveTextColor)
      .attr('transform', `translate(${radius}, ${textRiseScaleY(textVertPosition)})`)

    if (this.config.valueCountUp) {
      text1.transition()
        .duration(this.config.waveRiseTime)
        .tween('text', textTween)
      text2.transition()
        .duration(this.config.waveRiseTime)
        .tween('text', textTween)
    }

    const waveGroupXPosition = fillCircleMargin + fillCircleRadius * 2 - waveClipWidth;
    if (this.config.waveRise) {
      waveGroup.attr('transform', `translate(${waveGroupXPosition}, ${waveRiseScale(0)})`)
        .transition()
        .duration(this.config.waveRiseTime)
        .attr('transform', `translate(${waveGroupXPosition},${waveRiseScale(fillPercent)})`)
    } else {
      waveGroup.attr('transform', `translate(${waveGroupXPosition}, ${waveRiseScale(fillPercent)})`);
    }

    const waveAnimateTime = this.config.waveAnimateTime
    if (this.config.waveAnimate) animateWave();

    function animateWave() {
      wave.attr('transform', 'translate(' + waveAnimateScale(wave.attr('T')) + ',0)');
      wave.transition()
        .duration(waveAnimateTime * (1 - wave.attr('T')))
        .ease(d3.easeLinear)
        .attr('transform', 'translate(' + waveAnimateScale(1) + ',0)')
        .attr('T', 1)
        .on('end', function () {
          wave.attr('T', 0);
          animateWave()
        });
    }

    // 更新
    this.update = function (value) {
      this.value = value
      const textFinalValue = parseFloat(value).toFixed(2)
      const fillPercent = Math.max(this.config.minValue, Math.min(this.config.maxValue, value)) / this.config.maxValue
      const textRounder = buildTextRounder(this.value)
      const textTween = buildTextTween(textRounder, percentText, textFinalValue)
      const height = waveRiseScale(fillPercent)

      text1.transition()
        .duration(this.config.waveRiseTime)
        .tween('text', textTween);
      text2.transition()
        .duration(this.config.waveRiseTime)
        .tween('text', textTween);
      waveGroup.transition()
        .duration(this.config.waveRiseTime)
        .attr('transform', `translate(${waveGroupXPosition}, ${height})`)
    }

  }

}
