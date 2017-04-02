import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import os
import json
from tornado.options import define, options

import wmds
import update_X
import compute_similarity



define("port", default=8689, help="run on the given port", type=int)


class MainHandler(tornado.web.RequestHandler):
    def get(self):
    	self.render("index.html")
    def post(self):
        mds_message = self.request.body.decode('ascii')
        signal_MDS = mds_message.split('%')[1]

        dict_circles = {}
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

        wmds.main(int(signal_MDS))

        with open("static/data/demo_pos_reset.json", "r") as fs:
            data_feedback = json.load(fs)
        self.write(data_feedback)


class WeightChangeHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html")
    def post(self):
        weight_message = self.request.body.decode('ascii')
        weight_new = weight_message.split("%")[0]
        singal_MDS = weight_message.split("%")[1]

        compute_similarity.compute_pos_with_update_w(int(singal_MDS), weight_new)

        with open("static/data/demo_pos_reset.json", "r") as fs:
            data_feedback = json.load(fs)
        self.write(data_feedback)

class FocusUserConfirmHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html")
    def post(self):
        focusUserId = self.request.body.decode('ascii')
        user_num = update_X.update_current_X(focusUserId)
        self.write(str(user_num))

class MDSRuleApplyHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html")
    def post(self):
        weight_apply = self.request.body.decode('ascii')
        #调用你的函数
        with open("static/data/D_pos300.json", "r") as fs:
            data_feedback = json.load(fs)
        self.write(data_feedback)


settings = {
    "static_path": os.path.join(os.path.dirname(__file__), "static"),
    "debug": True
}

def main():
    tornado.options.parse_command_line()
    application = tornado.web.Application([
        (r"/", MainHandler),
        (r"/weightChange", WeightChangeHandler),
        (r"/focusUserChange", FocusUserConfirmHandler),
        (r"/mdsRuleApply", MDSRuleApplyHandler)

    ],**settings)

    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.current().start()


if __name__ == "__main__":
    main()
    