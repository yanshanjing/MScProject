package uk.ac.bham.cs.commdet.cyto.json;

import java.util.*;

import com.google.gson.annotations.Expose;

public class SubGraph {

	@Expose
	private Set<SubNode> nodes = new HashSet<SubNode>();
	
	@Expose
	private Set<UndirectedEdge> edges = new HashSet<UndirectedEdge>(); 
	
	public SubGraph() {}
	
	public SubGraph(Set<SubNode> nodes, Set<UndirectedEdge> edges) {
		this.nodes = nodes;
		this.edges = edges;
	}

	public Set<SubNode> getNodes() {
		return nodes;
	}

	public void setNodes(Set<SubNode> nodes) {
		this.nodes = nodes;
	}

	public Set<UndirectedEdge> getEdges() {
		return edges;
	}

	public void setEdges(Set<UndirectedEdge> edges) {
		this.edges = edges;
	}
	
	public int getSize() {
		return nodes.size();
	}
}