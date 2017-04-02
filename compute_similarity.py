import numpy as np
import math
import json
import os
import time
from scipy.special import expit
import matplotlib.pyplot as plt
from sklearn import manifold
from sklearn.datasets import load_svmlight_file
import tools
import path
import wmds



ori_data_path = path.ori_data_path
current_data_path = r'data\current_X.csv'
update_pos_path = r'static\data\demo_pos_reset.json'



def canberra_dis(f1_list, f2_list):
	res = 0
	for i in range(0, len(f1_list)):
		if f1_list[i]==f2_list[i]==0:
			res += 0
		else:
			res += abs((f1_list[i]-f2_list[i])/(f1_list[i]+f2_list[i]))
	# return res
	return res
	# return res/len(f1_list)

def w_canberra_dis(f1_list, f2_list, w):
	res = 0
	for i in range(0, len(f1_list)):
		if f1_list[i]==f2_list[i]==0:
			res += 0
		else:
			res += w[i]*abs((f1_list[i]-f2_list[i])/(f1_list[i]+f2_list[i]))
	# return res
	return res
	# return res/len(f1_list)
 
def euclidean_dis(coords1, coords2):
	""" Calculates the euclidean distance between 2 lists of coordinates. """
	return sum((x - y)**2 for x, y in zip(coords1, coords2))**0.5

def w_euclidean_dis(coords1, coords2, w):
    """ Calculates the euclidean distance between 2 lists of coordinates. """
    return sum(w*(x - y)**2 for x, y, w in zip(coords1, coords2, w))**0.5

def extract_feature_from_file(user_feature, n):
	'''从文件中提取高维空间表示X'''
	X, Y = load_svmlight_file(user_feature)   # 获得特征列表
	
	# 据数量控制
	if n>0:
		X = X[:n]
		Y = Y[:n]

	return X.todense().tolist(), Y.tolist()

def cal_mds(simi_matrix):
    positions_info = {}

    # start = time.time()
    seed = np.random.RandomState(seed=3)
    mds = manifold.MDS(n_components=2, max_iter=3000, eps=1e-9, random_state=seed,
                           dissimilarity="precomputed", n_jobs=1)
    pos = mds.fit(simi_matrix).embedding_
    # end = time.time()
    # print("MDS计算耗时: ", end-start)
    positions_info["positions"] = pos.tolist()

    return positions_info

def read_matrix(X, fname):
    f = open(fname, 'r')
    x = 0
    for line in f:
        line = line.strip().split(',')
        for y in range(len(line)):
            X[x][y] = line[y]
        x += 1
        if x==X.shape[0]:
        	break

def compute_pos_with_w(user_feature, final_feature, n, w):
	# 获得特征数量
	f = open(final_feature, encoding='utf-8')
	ori_data_dim = len(f.readline().strip().split(','))
	f.close()

	# 获得特征列表
	X = np.zeros((n, ori_data_dim))
	read_matrix(X, final_feature)
	X = X.tolist()

	# 计算相似度
	u_num = len(X)   # 用户数量
	f_num = ori_data_dim   # 特征数量
	sm = np.zeros(shape=(u_num, u_num))   # 相似度矩阵
	for i in range(0, u_num):
		for j in range(i+1, u_num):
			if i==j:
				sm[i][j]= 0
			else:
				l1 = X[i]
				l2 = X[j]
				# sm[i][j] = sm[j][i] = canberra_dis(l1, l2)
				sm[i][j] = sm[j][i] = w_euclidean_dis(l1, l2, w)
				# sm[i][j] = sm[j][i] = w_canberra_dis(l1, l2, w)
	pos_info = cal_mds(sm)

	# out put w
	pos_info["weight"] = {"value": w}

	return pos_info

def load_useridlist(userid_path, usernum):
    user_ids = []
    with open(userid_path, encoding='utf-8') as f:
        for i in range(0, usernum):
            user_ids.append(f.readline().strip())
    return user_ids

def index2id(user_ids, userindexs_list):
    user_ids_new = []
    for index in userindexs_list:
        user_ids_new.append(user_ids[index])
    return user_ids_new

def compute_user(user_id_path, predict_path, user_feature, final_feature, n):
	user_info = {}

	# 计算用户id
	user_ids = load_useridlist(user_id_path, n)
	user_idlist = index2id(user_ids, list(range(n)))
	user_info["user_id"] = user_idlist

	# 获取用户预测结果
	predicts = load_useridlist(predict_path, n)


	user_info ['attr_name'] = ['lable', 'ML_result',
							   'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 
							   'P9', 'P10', 'P11', 'P12', 'P13', 'P14', 'P15', 'P16', 
							   'answers', 'questions', 'accepted', 'comments', 
							   'QA_ratio', 'AA_ratio', 'UA_ratio', 'upvoted', 'upvotes',
							   'R_max', 'R_min', 'R_Q1', 'R_Q2', 'R_Q3', 'R_sum', 'R_mean', 'R_std', 'R_var',
							   'T_max', 'T_min', 'T_Q1', 'T_Q2', 'T_Q3', 'T_sum', 'T_mean', 'T_std', 'T_var',
							   'ans_w_sum', 'ans_mean', 'ans_last_change', 'ans_whole_mean', 'ans_whole_std',
							   'act_w_sum', 'act_mean', 'act_last_change', 'act_whole_mean', 'act_whole_std']
	
	# user_info ['attr_name'] = ['lable', 'ML_result',
	# 					   'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 
	# 					   'P9', 'P10', 'P11', 'P12', 'P13', 'P14', 'P15', 'P16']

	# user_info ['attr_name'] = ['lable', 'ML_result',
	# 				   'answers', 'questions', 'accepted', 'comments', 
	# 				   'QA_ratio', 'AA_ratio', 'UA_ratio', 'upvoted', 'upvotes']

	# user_info ['attr_name'] = ['lable', 'ML_result',
	# 						   'R_max', 'R_min', 'R_Q1', 'R_Q2', 'R_Q3', 'R_sum', 'R_mean', 'R_std', 'R_var',
	# 						   'T_max', 'T_min', 'T_Q1', 'T_Q2', 'T_Q3', 'T_sum', 'T_mean', 'T_std', 'T_var',
	# 						   'ans_w_sum', 'ans_mean', 'ans_last_change', 'ans_whole_mean', 'ans_whole_std',
	# 						   'act_w_sum', 'act_mean', 'act_last_change', 'act_whole_mean', 'act_whole_std']

	
	X_fade, Y = extract_feature_from_file(user_feature, n)
	X = np.zeros((n, (len(user_info ['attr_name'])-2)))
	read_matrix(X, final_feature)

	attr_values = []
	for i in range(n):
		# 添加真实类标
		attr_values.append([(Y[i])])
		# 添加预测结果
		attr_values[i].extend([float(predicts[i])])
		# 添加时序属性
		attr_values[i].extend(X[i])
	user_info['attr_values'] = attr_values

	return user_info

def compute_init_file(user_id_path, predict_path, user_feature, final_feature, output_files, n, w):
	# 计算位置
	pos_info = compute_pos_with_w(user_feature, final_feature, n, w)
    # 输出计算好的位置
	with open(output_files[0], 'w', ) as fp:
		json.dump(pos_info, fp)

	# 计算用户属性
	user_info = compute_user(user_id_path, predict_path, user_feature, final_feature, n)
	# 输出用户属性
	with open(output_files[1], 'w', ) as fu:
		json.dump(user_info, fu)

def compute_pos_with_update_w(n, w_string):
	# 获得更新后的权重
	w = json.loads(w_string)["value"]
	# 归一化
	for i in range(len(w)):
		w[i] = w[i]/sum(w)

	# 获得特征数量
	f = open(current_data_path, encoding='utf-8')
	ori_data_dim = len(f.readline().strip().split(','))
	f.close()

	# 获得特征列表
	X = np.zeros(shape=(int(n), ori_data_dim))
	read_matrix(X, current_data_path)
	X = X.tolist()

	# 计算相似度
	u_num = len(X)   # 用户数量
	f_num = ori_data_dim   # 特征数量
	sm = np.zeros(shape=(u_num, u_num))   # 相似度矩阵
	for i in range(0, u_num):
		for j in range(i+1, u_num):
			if i==j:
				sm[i][j]= 0
			else:
				l1 = X[i]
				l2 = X[j]
				# sm[i][j] = sm[j][i] = canberra_dis(l1, l2)
				sm[i][j] = sm[j][i] = w_euclidean_dis(l1, l2, w)
				# sm[i][j] = sm[j][i] = w_canberra_dis(l1, l2, w)
	pos_info = cal_mds(sm)

	# out put w
	pos_info["weight"] = {"value": w}

	with open(update_pos_path, 'w', encoding='utf-8') as fp:
		json.dump(pos_info, fp)

def compute_pos_with_update_w_and_all_data(n, w_string):
	# 获得更新后的权重
	w = json.loads(w_string)["value"]
	# 归一化
	for i in range(len(w)):
		w[i] = w[i]/sum(w)

	# 获得特征数量
	f = open(ori_data_path, encoding='utf-8')
	ori_data_dim = len(f.readline().strip().split(','))
	f.close()

	# 获得特征列表
	X = np.zeros(shape=(int(n), ori_data_dim))
	read_matrix(X, ori_data_path)
	X = X.tolist()

	# 计算相似度
	u_num = len(X)   # 用户数量
	f_num = ori_data_dim   # 特征数量
	sm = np.zeros(shape=(u_num, u_num))   # 相似度矩阵
	for i in range(0, u_num):
		for j in range(i+1, u_num):
			if i==j:
				sm[i][j]= 0
			else:
				l1 = X[i]
				l2 = X[j]
				# sm[i][j] = sm[j][i] = canberra_dis(l1, l2)
				sm[i][j] = sm[j][i] = w_euclidean_dis(l1, l2, w)
				# sm[i][j] = sm[j][i] = w_canberra_dis(l1, l2, w)
	pos_info = cal_mds(sm)

	# out put w
	pos_info["weight"] = {"value": w}

	with open(update_pos_path, 'w', encoding='utf-8') as fp:
		json.dump(pos_info, fp)


if __name__ == '__main__':
	feature_path = r'data\feature_2013Dana1_3m_addtrans.txt'
	user_id_path = r'UserInfo_Spider\userid_sample1.txt'
	predict_path = r'data\predict_result.txt'
	
	pos_path = r'static\data\aw_pos300.json'
	user_path = r'static\data\aw_user300.json'
	# pos_path = r'static\data\all_pos300.json'
	# user_path = r'static\data\all_user300.json'
	# pos_path = r'static\data\all_pos3000.json'
	# user_path = r'static\data\all_user3000.json'

	final_feature = r'data\final_X_all.csv'
	# final_feature = r'data\final_X_P.csv'
	# final_feature = r'data\final_X_D.csv'
	# final_feature = r'data\final_X_T.csv'

	# X_path = r'data\demo_X.txt'
	# X1_path = r'data\demo_X300.csv'
	# Z_input_path = r'data\demo_pos30.json'
	# Z_output_path = r'data\demo_Z.txt'
    
    #all weight
	w_all = [0.066127416712772766, 0.0082744977989300875, 0.054739888774312989, 0.0023485922858605848, 0.0013754096971996918, 0.00097364933445587623, 0.00029252915464726773, 0.00020668757220236716, 0.00021156909551990765, 9.0515221046712777e-05, 0.0, 0.0, 7.1219081461757577e-06, 0.0, 0.0, 5.2903526627576391e-05, 0.096539886179488901, 0.0070067891501747886, 0.0036601624075837274, 0.0076049285465099505, 0.0069068072908452932, 0.0045883616854361349, 0.02234013842182541, 0.075653660124317595, 0.14183204473127514, 0.022334431361669974, 0.0018989924858445546, 0.0019856469124243784, 0.0025875660762052716, 0.002836124297082633, 0.090174170197618739, 0.010271189839089498, 0.027324140548996467, 0.026191898894497734, 0.0093013450674418706, 0.00973940900875973, 0.0088320827165589144, 0.0081563893899596895, 0.0078607845726718761, 0.023002944546027894, 0.0073049999266997382, 0.008427015900952543, 0.0061351177913022744, 0.084178528600595923, 0.027323650719522297, 0.027286830546950247, 0.0044599758552989364, 0.018908838408210792, 0.027929291076801026, 0.0078498496903315878, 0.0069665440330136325, 0.0057084934314275216, 0.014190188484865248]
	# w_all = [1/53]*53
	# w_p = [0.17079631308484639, 0.25302155875773774, 0.26297122045041715, 0.16129948713523509, 0.050987977756340702, 0.057870026682324195, 0.012855489153186567, 0.012807898441869829, 0.0062528192559777301, 0.0013705562154007515, 0.0038727348689308215, 0.00036880993553144663, 0.00019941276387299027, 2.6848639103212133e-05, 8.1727012078587732e-06, 0.0052906741580176254]
	# w_p = [1/16]*16
	# w_d = [0.22349856305460172, 0.026569077081189853, 0.072407525396135222, 0.041883080072120465, 0.0279602369791878, 0.068486355957953063, 0.056001276935218683, 0.25292289885263691, 0.2302709856709563]
	# w_d = [1/9]*9
	# w_t = [0.010645138735128111, 0.001166000732251206, 0.0022534713279769884, 0.0025240610403856447, 0.004762353457630519, 0.12101112934632414, 0.012610475977073201, 0.047016453629126945, 0.076114942878708902, 0.012805872642211419, 0.025522857801706291, 0.012538361549467414, 0.015294231425727035, 0.013123174679831604, 0.059622583341520034, 0.013955671833921462, 0.051253020891374221, 0.0090413747615837228, 0.085993054872623362, 0.071461197916733638, 0.12255733607810788, 0.0065578950786049249, 0.063190565220746564, 0.10464736619666987, 0.011260131424827537, 0.0102609320320011, 0.0086091287892551167, 0.024201216338481091]
	# w_t = [1/28]*28

	# # init file
	compute_init_file(user_id_path, predict_path, feature_path, final_feature,
					  [pos_path, user_path], 300, w_all)
	
	# # 输出测试X
	# X, Y = extract_feature_from_file(feature_path, -1)
	# user_num = len(X)
	# feature_num = len(X[0])
	# with open(X1_path, 'w', encoding='utf-8') as f:
	# 	for i in range(0, user_num):
	# 		oneuserstr = ''
	# 		# oneuserstr = str(i) +','+ str(Y[i]) +','
	# 		for j in range(0, feature_num):
	# 			oneuserstr += str(X[i][j])
	# 			if j<(feature_num-1):
	# 				oneuserstr += ','
	# 			else:
	# 				oneuserstr += '\n'
	# 		f.write(oneuserstr)

	# 输出测试Z
	# with open(Z_input_path, 'r', encoding='utf-8') as fz1:
	# 	with open(Z_output_path, 'w', encoding='utf-8') as fz2:
	# 		jsonstr = fz1.readline()
	# 		data = json.loads(jsonstr)
	# 		for i in range(0,len(data['positions'])):
	# 			fz2.write(str(data['positions'][i][0])+','
	# 				+str(data['positions'][i][1])+'\n')
