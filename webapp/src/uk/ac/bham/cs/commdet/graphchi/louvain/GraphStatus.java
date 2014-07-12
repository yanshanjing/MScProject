package uk.ac.bham.cs.commdet.graphchi.louvain;

import java.util.*;

import edu.cmu.graphchi.preprocessing.VertexIdTranslate;

public class GraphStatus {

	private int[] nodeToCommunity;
	private int[] communityInternalEdges;
	private int[] communityTotalEdges;
	private int[] nodeWeightedDegree;
	private int[] nodeSelfLoops;
	private int[] communitySize;
	private long totalGraphWeight;
	private int hierarchyHeight = 0;
	private VertexIdTranslate originalVertexTrans;
	private VertexIdTranslate updatedVertexTrans;
	private Map<Integer, Double> modularities = new HashMap<Integer, Double>();
	private Map<Integer, List<Integer>> communityHierarchy = new HashMap<Integer, List<Integer>>();
	private Map<Community, Integer> allCommunitySizes = new HashMap<Community, Integer>();

	/*
	 * must be called after initial single node communities are set, before any further updates.
	 */
	public void initialiseCommunitiesMap() {
		for (int i = 0; i < nodeToCommunity.length; i++) {
			if (nodeToCommunity[i] != -1) {
				communityHierarchy.put(originalVertexTrans.backward(nodeToCommunity[i]), new ArrayList<Integer>());
			}
		}
	}

	public void updateCommunitiesMap() {
		if (hierarchyHeight == 0) {
			for (int i = 0; i < nodeToCommunity.length; i++) {
				if (communityHierarchy.containsKey(originalVertexTrans.backward(i))) {
					List<Integer> communities = communityHierarchy.get(originalVertexTrans.backward(i));
					communities.add(originalVertexTrans.backward(nodeToCommunity[i]));
				}
			}
		} else {
			for (Map.Entry<Integer, List<Integer>> node : communityHierarchy.entrySet()) {
				int nodeId = node.getKey();
				List<Integer> communities = node.getValue();
				int currentGcId = updatedVertexTrans.forward(nodeId);
				if (nodeId < nodeToCommunity.length && nodeToCommunity[currentGcId] != -1) {
					int latestCommunity = updatedVertexTrans.backward(nodeToCommunity[currentGcId]);
					communities.add(latestCommunity);
				} else {
					int previousCommunity = communities.get(hierarchyHeight - 1);
					int previousCommunityGcId = updatedVertexTrans.forward(previousCommunity);
					int latestCommunityGcId = nodeToCommunity[previousCommunityGcId];
					if (updatedVertexTrans.backward(latestCommunityGcId) == -1) {
						System.out.println("This is not a connected graph");
						/* this happens when graph is not connected, resulting in single disjoint communities,
						 * therefore community will simply remain the same
						 */
						communities.add(previousCommunity);
					} else {
						communities.add(updatedVertexTrans.backward(latestCommunityGcId));
					}
				}
			}
		}
	}

	/*
	 * Need to amend to account for disconnected graph. Potential to deal with inside hierarchy update method.
	 */
	public void updateSizesMap() {
		for (int i = 0; i < communitySize.length; i++) {
			if (communitySize[i] > 0) {
				allCommunitySizes.put(new Community(updatedVertexTrans.backward(i), hierarchyHeight), communitySize[i]);
			}
		}
	}

	public Map<Integer, Double> getModularities() {
		return modularities;
	}

	public Map<Integer, List<Integer>> getCommunityHierarchy() {
		return communityHierarchy;
	}

	public Map<Community, Integer> getCommunitySizes() {
		return allCommunitySizes;
	}

	public void setOriginalVertexTrans(VertexIdTranslate trans) {
		this.originalVertexTrans = trans;
	}

	public void setUpdatedVertexTrans(VertexIdTranslate trans) {
		this.updatedVertexTrans = trans;
	}

	public void incrementHeight() {
		hierarchyHeight++;
	}

	public int[] getNodeToCommunity() {
		return nodeToCommunity;
	}

	public void setNodeToCommunity(int[] nodeToCommunity) {
		this.nodeToCommunity = nodeToCommunity;
	}

	public int[] getCommunityInternalEdges() {
		return communityInternalEdges;
	}

	public void setCommunityInternalEdges(int[] communityInternalEdges) {
		this.communityInternalEdges = communityInternalEdges;
	}

	public int[] getCommunityTotalEdges() {
		return communityTotalEdges;
	}

	public void setCommunityTotalEdges(int[] communityTotalEdges) {
		this.communityTotalEdges = communityTotalEdges;
	}

	public int[] getNodeWeightedDegree() {
		return nodeWeightedDegree;
	}

	public void setNodeWeightedDegree(int[] nodeWeightedDegree) {
		this.nodeWeightedDegree = nodeWeightedDegree;
	}

	public int[] getNodeSelfLoops() {
		return nodeSelfLoops;
	}

	public void setNodeSelfLoops(int[] nodeSelfLoops) {
		this.nodeSelfLoops = nodeSelfLoops;
	}

	public int[] getCommunitySize() {
		return communitySize;
	}

	public void setCommunitySize(int[] communitySize) {
		this.communitySize = communitySize;
	}

	public long getTotalGraphWeight() {
		return totalGraphWeight;
	}

	public void setTotalGraphWeight(long totalGraphWeight) {
		this.totalGraphWeight = totalGraphWeight;
	}

}