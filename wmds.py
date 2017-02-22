"""
=========================
Multi-dimensional scaling
=========================

An illustration of the metric and non-metric MDS on generated noisy data.

The reconstructed points using the metric MDS and non metric MDS are slightly
shifted to avoid overlapping.
"""

# Author: Nelle Varoquaux <nelle.varoquaux@gmail.com>
# License: BSD

# print(__doc__)
import numpy as np
import random
from sklearn import manifold
from sklearn.metrics import euclidean_distances

import json
import sys

ori_data_num = 30
ori_data_dim = 9
ori_data_path = "data/demo_X.csv"
new_data_dim = 2

class V2PI:
    def __init__(self, points_num, ori_dim, map_dim, dist_method="euclidean", X_true=None, Z=None):
        if dist_method == "euclidean":
            self.dist_pair_func = self.pair_euclidean_distance
            self.dist_func = self.euclidean_distance
            self.c_sum = 5000000
            self.threshold = 1e-6
        elif dist_method == "canberra":
            self.dist_pair_func = self.pair_canberra_distance
            self.dist_func = self.canberra_distance
            self.c_sum = 50
            self.threshold = 1e-9
        else:
            print("Wrong distance method!")
            sys.exit(-1)

        self.c_w = 500000000
        self.alpha = 0.25
        self.beta = 0.8
        self.main_loss = 50000000
        self.total_loss = 50000000

        self.points_num = points_num
        self.ori_dim = ori_dim
        self.map_dim = map_dim

        self.X_dist = np.zeros((points_num, points_num, ori_dim))
        self.Z_dist = np.zeros((points_num, points_num))
        self.Z_sum = 0.0

        if X_true is not None:
            self.X_true = X_true
        else:
            self.X_true = np.zeros((points_num, ori_dim))
            self.read_matrix(self.X_true, ori_data_path)
            self.X_true -= self.X_true.mean()
        if Z is not None:
            self.Z = Z
        else:
            self.Z = np.zeros((points_num, map_dim))

    def read_matrix(self, X, fname):
        f = open(fname, 'r')
        x = 0
        for line in f:
            line = line.strip().split(',')
            for y in range(len(line)):
                X[x][y] = line[y]
            x += 1

    def pair_euclidean_distance(self, i, j, sub):
        return (self.X_true[i][sub] - self.X_true[j][sub]) ** 2

    def pair_canberra_distance(self, i, j, sub):
        return abs(self.X_true[i][sub] - self.X_true[j][sub]) * 1.0 / (abs(self.X_true[i][sub]) + abs(self.X_true[j][sub]))

    def weighting_dist(self, i, j, w):
        weighted_dist_x_pair = 0
        for sub in range(np.shape(self.X_true)[1]):
            weighted_dist_x_pair += max(0, w[sub]) * self.X_dist[i][j][sub]
        return weighted_dist_x_pair

    def euclidean_distance(self, i, j, w):
        return np.sqrt(self.weighting_dist(i, j, w))
        # return np.sqrt(np.shape(self.X_true)[1] * self.weighting_dist(i, j, w))

    def canberra_distance(self, i, j, w):
        return self.weighting_dist(i, j, w)
        # return np.shape(self.X_true)[1] * self.weighting_dist(i, j, w)

    def cal_Z_by_mds(self, w):
        seed = np.random.RandomState(seed=3)
        if self.dist_func == self.euclidean_distance:
            similarities = np.zeros((np.shape(self.X_true)[0], np.shape(self.X_true)[0]))
            for i in range(np.shape(similarities)[0]):
                for j in range(i + 1, np.shape(similarities)[1]):
                    similarities[i][j] = np.sqrt(max(sum(self.X_dist[i][j] * w),0))
                    similarities[j][i] = np.sqrt(max(sum(self.X_dist[i][j] * w),0))
            # similarities = euclidean_distances(self.X_true)
        elif self.dist_func == self.canberra_distance:
            similarities = np.zeros((np.shape(self.X_true)[0], np.shape(self.X_true)[0]))
            for i in range(np.shape(similarities)[0]):
                for j in range(i + 1, np.shape(similarities)[1]):
                    similarities[i][j] = sum(self.X_dist[i][j] * w)
                    similarities[j][i] = sum(self.X_dist[i][j] * w)
        else:
            print("Wrong distance method!")
            sys.exit(-1)

        mds = manifold.MDS(n_components=2, max_iter=3000, eps=1e-9, random_state=seed,
                           dissimilarity="precomputed", n_jobs=1)
        self.Z = mds.fit(similarities).embedding_

    def cal_X_dist(self):
        for i in range(np.shape(self.X_true)[0]):
            for j in range(i + 1, np.shape(self.X_true)[0]):
                for sub in range(np.shape(self.X_true)[1]):
                    self.X_dist[i][j][sub] = self.dist_pair_func(i, j, sub)

    def cal_Z_dist(self):
        for i in range(np.shape(self.Z_dist)[0]):
            for j in range(i + 1, np.shape(self.Z_dist)[0]):
                # Defined distance of project point pair z_i,z_j
                self.Z_dist[i][j] = np.linalg.norm(self.Z[i] - self.Z[j])
                self.Z_sum += (self.Z_dist[i][j] ** 2)

    def gradient(self, w):
        dF_wp = np.array([0.0] * np.shape(self.X_true)[1])
        for i in range(np.shape(self.X_true)[0]):
            for j in range(i + 1, np.shape(self.X_true)[0]):
                dist_x_i_j = self.dist_func(i, j, w)
                # coef = np.shape(self.X_true)[1] * (self.Z_dist[i][j] - dist_x_i_j)
                coef = (self.Z_dist[i][j] - dist_x_i_j)
                if self.dist_func == self.euclidean_distance:
                    coef = coef / dist_x_i_j if dist_x_i_j != 0 else 0
                elif self.dist_func == self.canberra_distance:
                    coef *= 2
                else:
                    print("Wrong distance method!")
                    sys.exit(-1)
                dF_wp += -coef * self.X_dist[i][j]

        # partial derivative of w from constraint part
        dF_wp += 2 * self.c_sum * (sum(w) - 1)
        dF_wp += [-2 * self.c_w * max(-i,0) for i in w]
        return dF_wp

    def f_main_loss(self, w):
        self.main_loss = 0
        # point pair i and j: i<j<=K
        for i in range(np.shape(self.X_true)[0]):
            for j in range(i + 1, np.shape(self.X_true)[0]):
                # Defined distance of project point pair z_i,z_j
                dist_x_i_j = self.dist_func(i, j, w)
                # main function F part of loss, which is defined by square to simplify partial derivative
                self.main_loss += (self.Z_dist[i][j] - dist_x_i_j) ** 2

    def f_stress(self):
        # self.f_main_loss(dist_func)
        return np.sqrt(self.main_loss / self.Z_sum)

    def f_loss(self, w):
        #main part of loss
        self.f_main_loss(w)
        # constraint part of loss
        loss = self.main_loss + self.c_sum * ((sum(w) - 1) ** 2) + self.c_w * (sum([max(0, -i) ** 2 for i in w]))
        return loss

    def update_w(self, w):
        # w = [1.0 / np.shape(self.X_true)[1]] * np.shape(self.X_true)[1]
        # w = [random.uniform(0,1) for i in range(np.shape(self.X_true)[1])]
        # sum_w = sum(w)
        # w = [i/sum_w for i in w]
        # w = np.array(w)
        loss = self.f_loss(w)
        print("ori_main_loss: " + str(self.main_loss))
        print("ori_total_loss: " + str(loss))
        print("ori_stress: " + str(self.f_stress()))
        print("ori_w: %s" % w)

        epoch = 0
        step = 1
        while epoch < 100000:
            grad = self.gradient(w)
            # step of gradient descent

            new_loss = self.f_loss(w - step * grad)
            equal_flag = False
            while new_loss >= loss - self.alpha * step * sum(grad ** 2):
                if equal_flag == True:
                    break
                if new_loss == loss - self.alpha * step * sum(grad ** 2):
                    equal_flag = True
                else:
                    equal_flag = False
                step *= self.beta
                new_loss = self.f_loss(w - step * grad)

            if abs(new_loss - loss) / loss < self.threshold:
                break
            loss = new_loss
            w -= step * grad
            if epoch % 100 == 0:
                print("epoch: %s, main_loss: %s, total_loss: %s" % (epoch, self.main_loss, loss))
                print("step: %s, w: %s, " % (step, w))
                print("sum_w: %s, stress: %s" % (sum(w), self.f_stress()))

            epoch += 1

        print("final epoch: %s" % epoch)
        print("final loss :%s , w: %s" % (loss, w))
        print("final stress: " + str(self.f_stress()))
        print("final sum_w: %s" % (sum(w)))

        return w

def read_matrix(X, fname):
    f = open(fname, 'r')
    x = 0
    for line in f:
        line = line.strip().split(',')
        for y in range(len(line)):
            X[x][y] = line[y]
        x += 1

# 读传回的json文件
def init_matrix(ori_data_num, ori_data_dim, new_data_dim):
    user_pos_dict = {}
    user_pos_dict['positions'] = []
    user_pos_dict['user_id'] = []
    user_set = set()
    with open("static/data/pos_v2pi.json", "r") as fs:
        changing_data = json.load(fs)
        for k, v in changing_data.items():
            for pos, user in zip(v['positions'], v['user_id']):
                if user in user_set:
                    continue
                user_set.add(user)
                user_pos_dict['positions'].append(pos)
                user_pos_dict['user_id'].append(user)

    X = np.zeros((ori_data_num, ori_data_dim))
    read_matrix(X, ori_data_path)
    X_new = np.zeros((len(user_set), ori_data_dim))
    Z_new = np.zeros((len(user_set), new_data_dim))

    sub = 0
    for pos, user in zip(user_pos_dict['positions'], user_pos_dict['user_id']):
        X_new[sub] = X[int(user)]
        Z_new[sub] = pos
        sub += 1

    X_new -= X_new.mean()
    return X_new, Z_new


def run(v2pi):
    v2pi.cal_X_dist()
    # self.read_matrix(self.Z, "data/Z_euclidean.csv")
    # self.read_matrix(self.Z, "data/Z_canberra.csv")
    w = [1.0 / np.shape(v2pi.X_true)[1]] * np.shape(v2pi.X_true)[1]
    # w = [random.uniform(0,1) for i in range(np.shape(v2pi.X_true)[1])]
    # sum_w = sum(w)
    # w = [i/sum_w for i in w]
    w = np.array(w)

    # v2pi.cal_Z_by_mds(w)
    # Rescale the data
    # v2pi.Z *= np.sqrt((v2pi.X_true ** 2).sum()) / np.sqrt((v2pi.Z ** 2).sum())
    # 跟新w
    v2pi.cal_Z_dist()
    w = v2pi.update_w(w)

    #cal mds by calculated w
    v2pi_new = V2PI(ori_data_num, ori_data_dim, new_data_dim)
    v2pi_new.cal_X_dist()
    v2pi_new.cal_Z_by_mds(w)
    print(v2pi_new.Z)
    print("Weight: %s" % w)

    # 写回json文件
    point_dict = {}
    point_dict['positions'] = []
    point_dict['user_id'] = []
    point_dict['weight'] = {"value": []}

    for i in range(len(v2pi_new.Z)):
        point_dict['user_id'].append(i)
        point_dict['positions'].append(list(v2pi_new.Z[i]))

    for i in range(len(w)):
        point_dict['weight']['value'].append(w[i])

    with open("static/data/demo_pos_reset.json", 'w') as fs:
        json.dump(point_dict, fs)


def main():
    #point_num, original_dim, new_dim, method
    X, Z = init_matrix(ori_data_num, ori_data_dim, new_data_dim)
    # v2pi = V2PI(30, 9, 2, "canberra")
    # v2pi = V2PI(30, 9, 2)
    v2pi = V2PI(np.shape(X)[0], ori_data_dim, new_data_dim, "euclidean", X, Z)
    run(v2pi)


if __name__ == '__main__':
    main()
