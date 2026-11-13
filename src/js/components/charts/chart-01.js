import ApexCharts from "apexcharts";

// ===== chartOne
const chart01 = () => {
  const chartOneOptions = {
    series: [
      {
        name: "Trade revenue (£k)",
        data: [356, 341, 388, 402, 371, 365, 398, 421, 446, 468, 512, null],
      },
    ],
    colors: ["#c21413"],
    chart: {
      fontFamily: "Montserrat, sans-serif",
      type: "bar",
      height: 330,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Inter",

      markers: {
        radius: 99,
      },
    },
    yaxis: {
      title: false,
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },

    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: function (val) {
          return "£" + val + "K";
        },
      },
    },
  };

  const chartSelector = document.querySelectorAll("#chartOne");

  if (chartSelector.length) {
    const chartFour = new ApexCharts(
      document.querySelector("#chartOne"),
      chartOneOptions,
    );
    chartFour.render();
  }
};

export default chart01;
