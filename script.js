// render pie in javascript
d3.json('allcasedata.json', function (jsondata) {

    var verblabel = 'верить'
    var verbdata = jsondata[5][verblabel]

    d3.selectAll('.verblabel').text(verblabel)
    d3.selectAll('.windowsize').text(1)
    d3.selectAll('#prep').text('...')

    // prep labels are actually never specified
    var allPrepLabels = new Set();
    var allVerbLabels = Object.keys(jsondata[0])

    // sort verbs
    allVerbLabels.sort(function (a, b) {
        return a.localeCompare(b);
    })
    // add the options to the button
    d3.select("#selectButton")
        .selectAll('myOptions')
        .data(allVerbLabels)
        .enter()
        .append('option')
        .text(function (d) { return d; }) // text showed in the menu
        .attr("value", function (d) { return d; }) // corresponding value returned by the button

    $("#selectButton").val(verblabel);

    // set the dimensions and margins of the graph
    var width = 450
    height = 450
    margin = 40

    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    var radius = Math.min(width, height) / 2 - margin

    // set the color scale
    var color = d3.scaleOrdinal()
        .domain(allPrepLabels)
        .range(d3.schemeTableau10);

    draw_pie(verblabel, verbdata)

    // slider
    var sliderStep = d3
        .sliderBottom()
        .min(-4)
        .max(4)
        .width(200)
        .tickFormat(d3.format('.1'))
        .ticks(8)
        .step(1)
        .default(1)
        .on('onchange', val => {
            var windowsize = val + 4
            d3.selectAll('.windowsize').text(val)
            d3.selectAll('.sentence').remove()
            var selectedVerb = d3.select('#selectButton').property("value")
            var piedata = jsondata[windowsize][selectedVerb]
            if (Object.entries(piedata['counts']).length === 0) {

                draw_pie(selectedVerb, false)
            } else {
                draw_pie(selectedVerb, piedata)
            }
        });

    var gStep = d3
        .select('div#slider-step')
        .append('svg')
        .attr('width', 250)
        .attr('height', 100)
        .append('g')
        .attr('transform', 'translate(30,30)');

    gStep.call(sliderStep);

    // select button
    d3.select("#selectButton").on("change", function (d) {
        // recover the option that has been chosen
        var selectedVerb = d3.select(this).property("value")
        var windowsize = sliderStep.value() + 4
        // run the updateChart function with this selected option
        d3.selectAll('.verblabel').text(selectedVerb)
        d3.selectAll('#prep').text('...')
        d3.selectAll('.sentence').remove()
        var piedata = jsondata[windowsize][selectedVerb]
        if (Object.entries(piedata['counts']).length === 0) {
            draw_pie(selectedVerb, false)
        } else {
            draw_pie(selectedVerb, piedata)
        }
    })
    function draw_pie(verblabel, verbdata) {
        if (verbdata === false) {
            data = { "No prepositions in specified window": 1 }
        } else {
            var data = verbdata.counts
        }
        d3.selectAll(".svgclass").remove()
        // append the svg object to the div called 'my_dataviz'
        var svg = d3.select("#my_dataviz")
            .append("svg")
            .attr('class', 'svgclass')
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        // Compute the position of each group on the pie:
        var pie = d3.pie()
            .value(function (d) { return d.value; })
        var data_ready = pie(d3.entries(data))
        // Now I know that group A goes from 0 degrees to x degrees and so on.

        // shape helper to build arcs:
        var arcGenerator = d3.arc()
            .innerRadius(0)
            .outerRadius(radius)

        // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
        var slices = svg
            .selectAll('mySlices')
            .data(data_ready)
            .enter()
            .append('g')
            .attr('class', 'notchosen')

        var wedges = slices
            .append('path')
            .attr('d', arcGenerator)
            .attr('fill', function (d) { return (color(d.data.key)) })
            .attr("stroke", "black")
            .style("stroke-width", "2px")
            .style("opacity", 0.6)

        var labels = slices
            .append('text')
            .text(function (d) { 
                if (d.data.key == 'No prepositions in specified window') {
                    return d.data.key
                }
                return d.data.key + ' (' + d.data.value + ')'
             })
            .attr("transform", function (d) { return "translate(" + arcGenerator.centroid(d) + ")"; })
            .style("text-anchor", "middle")
            .style("font-size", 17)

        slices.on('mouseover', function() {
            slices.each(function() {
                var thisclass = d3.select(this).attr('class')
                if (thisclass == 'notchosen') {
                    d3.select(this).select('path').style('opacity', .1)
                    d3.select(this).select('text').style('opacity', .1)        
                }
            })
            d3.select(this).select('path').style('stroke-opacity', .5).style('opacity', .6)
            d3.select(this).select('text').style('opacity', 1)
        })
        slices.on('mouseout', function() {
            var chosenfound = false
            slices.each(function() {
                var thisclass = d3.select(this).attr('class')
                if (thisclass == 'notchosen') {
                    d3.select(this).select('path').style('opacity', .1)
                    d3.select(this).select('text').style('opacity', .1)        
                }
                else {
                    chosenfound = true
                }
            })
            if (!chosenfound) {
                slices.selectAll('path').style('stroke-opacity',1).style('opacity',.6)
                slices.selectAll('text').style('opacity',1)
            }
        })
        
        slices.on('click', function (d) {
            d3.selectAll('.sentence').remove()
            if (d3.select(this).attr('class') == 'chosen') {
                slices.selectAll('path').style('stroke-opacity',1).style('opacity',.6)
                slices.selectAll('text').style('opacity',1)   
            } else {
                slices.attr('class','notchosen')
                d3.select(this).attr('class','chosen')
                var sentences = verbdata['sentences'][d.data.key]
                d3.selectAll('#prep').text(d.data.key)
                sentences.forEach(function (sent) {
                    d3.select('#sentences')
                        .append('p')
                        .attr('class', 'sentence')
                        .text(sent)
                })
            }
        })
    }
})