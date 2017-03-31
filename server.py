import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import os
import json
import wmds

from tornado.options import define, options


define("port", default=8689, help="run on the given port", type=int)


class MainHandler(tornado.web.RequestHandler):
    def get(self):
    	self.render("index.html")
    def post(self):
        mds_message = self.request.body.decode('ascii')
        signal_MDS = mds_message.split('%')[1]
        dict_circles = {}
        # dict_circles
        dict_circles[0] = {"positions": [], "user_id": []}
        dict_circles[1] = {"positions": [], "user_id": []}
        dict_circles[2] = {"positions": [], "user_id": []}
        circles_all = mds_message.split('%')[0].split('@')
        for i in range(len(circles_all)):
            for circles_singleSet in circles_all[i].split("&"):
                if len(circles_singleSet) > 0:
                    single_plot = circles_singleSet.split('=')
                    temp_coordinate = single_plot[1].split(',')
                    single_plot_coordinate = []
                    single_plot_coordinate.append(float(temp_coordinate[0]))
                    single_plot_coordinate.append(float(temp_coordinate[1]))
                    dict_circles[i]["positions"].append(single_plot_coordinate)
                    dict_circles[i]["user_id"].append(single_plot[0])

        with open("static/data/pos_v2pi.json", 'w') as fs:
            json.dump(dict_circles, fs)

        wmds.main()

        # with open("static/data/demo_pos.json", "r") as fs:
        #     data_origin =json.load(fs)

        # for i in range(len(data_origin["positions"])):
        #     data_origin["positions"][i][0] = int(data_origin["positions"][i][0] * 100 + 10)
        #     data_origin["positions"][i][1] = int(data_origin["positions"][i][1] * 100 + 20)

        # with open("static/data/demo_pos_reset.json", "w") as fs:
        #     json.dump(data_origin, fs)
        with open("static/data/demo_pos_reset.json", "r") as fs:
            data_feedback = json.load(fs)
        self.write(data_feedback)



class WeightChangeHandler(tornado.web.RequestHandler):
    def get(self):
    	self.render("index.html")
    def post(self):
        weight_message = self.request.body.decode('ascii')
        weight_new = weight_message.split("%")[0]
        singal_weight = weight_message.split("%")[1]
        youfunction()   #师姐你的处理函数
        with open("static/data/demo_pos_reset.json", "r") as fs:
            data_feedback = json.load(fs)
        singal_weight_feedback = "这里写入新的返回的权值的signal" #这里写入你新的权值的signal
        self.write(json.dumps(data_feedback) + "%" + singal_weight_feedback)

class FocusUserConfirmHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html")
    def post(self):
        focusUserId = self.request.body.decode('ascii')
        youfunction()   #师姐你的处理函数
        self.write("这里写返回给前台的标识")



settings = {
    "static_path": os.path.join(os.path.dirname(__file__), "static"),
    "debug": True
}

def main():
    tornado.options.parse_command_line()
    application = tornado.web.Application([
        (r"/", MainHandler),
        (r"/weightChange", WeightChangeHandler),
        (r"/focusUserChange", FocusUserConfirmHandler)

    ],**settings)

    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.current().start()


if __name__ == "__main__":
    main()
    